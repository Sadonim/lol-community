import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../index";
import { riotIdSchema } from "@/lib/validators/riot.schema";
import { fetchFullSummonerData, RiotApiError } from "@/server/services/riot.service";

function toTRPCError(err: unknown): TRPCError {
  if (err instanceof RiotApiError) {
    if (err.code === "NOT_FOUND")
      return new TRPCError({ code: "NOT_FOUND", message: err.message });
    if (err.code === "RATE_LIMITED")
      return new TRPCError({ code: "TOO_MANY_REQUESTS", message: err.message });
    return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "알 수 없는 오류가 발생했습니다." });
}

export const riotRouter = createTRPCRouter({
  // 전적 검색 (비로그인 가능, DB 저장 없음)
  search: publicProcedure
    .input(riotIdSchema)
    .query(async ({ input }) => {
      try {
        return await fetchFullSummonerData(input.gameName, input.tagLine);
      } catch (err) {
        throw toTRPCError(err);
      }
    }),

  // 내 계정에 Riot 계정 연동
  link: protectedProcedure
    .input(riotIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

      // Riot API 호출은 트랜잭션 외부에서 수행 (외부 I/O는 트랜잭션 안에 두면 안 됨)
      let data;
      try {
        data = await fetchFullSummonerData(input.gameName, input.tagLine);
      } catch (err) {
        throw toTRPCError(err);
      }

      // 트랜잭션으로 중복 연동 레이스 컨디션 방지 (TOCTOU)
      try {
        const riotAccount = await ctx.prisma.$transaction(async (tx) => {
          const existingByUser = await tx.riotAccount.findUnique({
            where: { userId },
            select: { gameName: true, tagLine: true },
          });
          if (existingByUser) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `이미 연동된 계정이 있습니다: ${existingByUser.gameName}#${existingByUser.tagLine}`,
            });
          }

          const existingByPuuid = await tx.riotAccount.findUnique({
            where: { puuid: data.puuid },
            select: { id: true },
          });
          if (existingByPuuid) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "이 Riot 계정은 이미 다른 사용자와 연동되어 있습니다.",
            });
          }

          return tx.riotAccount.create({
            data: {
              userId,
              puuid: data.puuid,
              gameName: data.gameName,
              tagLine: data.tagLine,
              summonerLevel: data.summonerLevel,
              profileIconId: data.profileIconId,
              tier: data.tier,
              rank: data.rank,
              leaguePoints: data.leaguePoints,
              wins: data.wins,
              losses: data.losses,
              lastSyncedAt: new Date(),
            },
            select: {
              id: true,
              gameName: true,
              tagLine: true,
              tier: true,
              rank: true,
              leaguePoints: true,
            },
          });
        });

        return { success: true, riotAccount };
      } catch (e) {
        // TRPCError는 그대로 재던짐
        if (e instanceof TRPCError) throw e;
        // 유니크 제약 위반 (동시 요청)
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new TRPCError({ code: "CONFLICT", message: "이미 연동된 Riot 계정이 있습니다." });
        }
        throw e;
      }
    }),

  // 연동 해제
  unlink: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const existing = await ctx.prisma.riotAccount.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "연동된 Riot 계정이 없습니다." });
    }

    await ctx.prisma.riotAccount.delete({ where: { userId } });
    return { success: true };
  }),

  // 최신 전적 동기화 (5분 쿨타임)
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

    // 트랜잭션 안에서 쿨타임 확인 + lastSyncedAt 선점 업데이트 (레이스 컨디션 방지)
    let accountInfo: { gameName: string; tagLine: string };
    try {
      accountInfo = await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.riotAccount.findUnique({
          where: { userId },
          select: { gameName: true, tagLine: true, lastSyncedAt: true },
        });
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "연동된 Riot 계정이 없습니다." });
        }

        const elapsed = Date.now() - existing.lastSyncedAt.getTime();
        if (elapsed < SYNC_COOLDOWN_MS) {
          const remainingSec = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `${remainingSec}초 후에 다시 시도할 수 있습니다.`,
          });
        }

        // 슬롯 선점: 동시 요청이 들어와도 한 번만 통과
        await tx.riotAccount.update({
          where: { userId },
          data: { lastSyncedAt: new Date() },
        });

        return { gameName: existing.gameName, tagLine: existing.tagLine };
      });
    } catch (e) {
      if (e instanceof TRPCError) throw e;
      throw e;
    }

    let fresh;
    try {
      fresh = await fetchFullSummonerData(accountInfo.gameName, accountInfo.tagLine);
    } catch (err) {
      // 외부 API 실패 시 선점한 lastSyncedAt을 원복 (재시도 허용)
      await ctx.prisma.riotAccount.update({
        where: { userId },
        data: { lastSyncedAt: new Date(Date.now() - SYNC_COOLDOWN_MS) },
      }).catch(() => {});
      throw toTRPCError(err);
    }

    const updated = await ctx.prisma.riotAccount.update({
      where: { userId },
      data: {
        gameName: fresh.gameName,
        tagLine: fresh.tagLine,
        puuid: fresh.puuid,
        summonerLevel: fresh.summonerLevel,
        profileIconId: fresh.profileIconId,
        tier: fresh.tier,
        rank: fresh.rank,
        leaguePoints: fresh.leaguePoints,
        wins: fresh.wins,
        losses: fresh.losses,
        lastSyncedAt: new Date(),
      },
      select: {
        gameName: true,
        tagLine: true,
        tier: true,
        rank: true,
        leaguePoints: true,
        lastSyncedAt: true,
      },
    });

    return { success: true, riotAccount: updated };
  }),

  // 연동된 내 Riot 계정 조회
  myAccount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.riotAccount.findUnique({
      where: { userId: ctx.session.user.id },
      select: {
        gameName: true,
        tagLine: true,
        summonerLevel: true,
        profileIconId: true,
        tier: true,
        rank: true,
        leaguePoints: true,
        wins: true,
        losses: true,
        lastSyncedAt: true,
      },
    });
  }),

  // 랭킹 목록 (Riot 연동 유저, 티어/LP 기준)
  getRanking: publicProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.prisma.riotAccount.findMany({
      where: { tier: { not: null } },
      select: {
        gameName: true,
        tagLine: true,
        tier: true,
        rank: true,
        leaguePoints: true,
        wins: true,
        losses: true,
        profileIconId: true,
        user: { select: { username: true, avatarUrl: true } },
      },
    });

    const TIER_ORDER: Record<string, number> = {
      CHALLENGER: 9,
      GRANDMASTER: 8,
      MASTER: 7,
      DIAMOND: 6,
      EMERALD: 5,
      PLATINUM: 4,
      GOLD: 3,
      SILVER: 2,
      BRONZE: 1,
      IRON: 0,
    };

    const RANK_ORDER: Record<string, number> = { I: 4, II: 3, III: 2, IV: 1 };

    return accounts
      .sort((a, b) => {
        const tierA = TIER_ORDER[a.tier ?? ""] ?? -1;
        const tierB = TIER_ORDER[b.tier ?? ""] ?? -1;
        if (tierA !== tierB) return tierB - tierA;
        const rankA = RANK_ORDER[a.rank ?? ""] ?? 0;
        const rankB = RANK_ORDER[b.rank ?? ""] ?? 0;
        if (rankA !== rankB) return rankB - rankA;
        return (b.leaguePoints ?? 0) - (a.leaguePoints ?? 0);
      })
      .map((acc, index) => ({ ...acc, rank_position: index + 1 }));
  }),
});
