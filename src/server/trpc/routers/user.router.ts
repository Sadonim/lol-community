import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../index";

export const userRouter = createTRPCRouter({
  // 공개 프로필 조회
  getProfile: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          riotAccount: {
            select: {
              gameName: true,
              tagLine: true,
              tier: true,
              rank: true,
              leaguePoints: true,
              wins: true,
              losses: true,
              profileIconId: true,
              summonerLevel: true,
            },
          },
          posts: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              title: true,
              createdAt: true,
              viewCount: true,
              board: { select: { name: true, slug: true } },
              _count: { select: { comments: true, votes: true } },
            },
          },
          _count: { select: { posts: true, comments: true } },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "유저를 찾을 수 없습니다." });
      }

      return user;
    }),

  // 프로필 수정 (닉네임, 아바타 URL)
  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(2).max(20).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

      if (input.username) {
        const existing = await ctx.prisma.user.findUnique({
          where: { username: input.username },
          select: { id: true },
        });
        if (existing && existing.id !== userId) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 닉네임입니다." });
        }
      }

      const updated = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.username ? { username: input.username } : {}),
          ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
        },
        select: { id: true, username: true, avatarUrl: true },
      });

      return updated;
    }),

  // 비밀번호 변경
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "유저를 찾을 수 없습니다." });
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "현재 비밀번호가 올바르지 않습니다." });
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      return { success: true };
    }),
});
