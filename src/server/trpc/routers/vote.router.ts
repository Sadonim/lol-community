import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../index";
import { voteSchema, getMyVoteSchema } from "@/lib/validators/board.schema";

export const voteRouter = createTRPCRouter({
  // 투표 토글 (좋아요/싫어요)
  toggle: protectedProcedure.input(voteSchema).mutation(async ({ ctx, input }) => {
    const { value, postId, commentId } = input;
    const userId = ctx.session.user.id!;

    // 트랜잭션으로 감싸서 레이스 컨디션 방지
    // DB 유니크 제약(@@unique([userId, postId]), @@unique([userId, commentId]))과 함께 중복 투표 차단
    let result: { action: "removed" | "updated" | "created"; value: number | null };
    try {
      result = await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.vote.findFirst({
          where: {
            userId,
            ...(postId ? { postId } : {}),
            ...(commentId ? { commentId } : {}),
          },
        });

        if (existing) {
          if (existing.value === value) {
            // 같은 값 → 취소
            await tx.vote.delete({ where: { id: existing.id } });
            return { action: "removed" as const, value: null };
          } else {
            // 다른 값 → 변경
            const updated = await tx.vote.update({
              where: { id: existing.id },
              data: { value },
            });
            return { action: "updated" as const, value: updated.value };
          }
        }

        // 신규 투표
        await tx.vote.create({
          data: {
            value,
            userId,
            postId: postId ?? null,
            commentId: commentId ?? null,
          },
        });
        return { action: "created" as const, value };
      });
    } catch (e) {
      // 유니크 제약 위반 → 동시에 같은 투표 요청이 들어온 경우
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new TRPCError({ code: "CONFLICT", message: "이미 처리 중인 투표입니다. 잠시 후 다시 시도해주세요." });
      }
      throw e;
    }

    // 신규 투표 시에만 알림: 게시글 좋아요 (본인 제외, 좋아요만)
    if (result.action === "created" && postId && value === 1) {
      const post = await ctx.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true, board: { select: { slug: true } } },
      });
      if (post && post.authorId !== userId) {
        await ctx.prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "POST_VOTE",
            title: "게시글에 좋아요가 달렸습니다",
            body: `"${post.title}" 게시글에 좋아요가 달렸습니다.`,
            linkUrl: `/boards/${post.board.slug}/${postId}`,
          },
        });
      }
    }

    return result;
  }),

  // 내 투표 상태 조회
  getMyVote: protectedProcedure
    .input(getMyVoteSchema)
    .query(async ({ ctx, input }) => {
      const { postId, commentId } = input;

      if (!postId && !commentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "postId 또는 commentId가 필요합니다.",
        });
      }

      const vote = await ctx.prisma.vote.findFirst({
        where: {
          userId: ctx.session.user.id,
          ...(postId ? { postId } : {}),
          ...(commentId ? { commentId } : {}),
        },
        select: { value: true },
      });

      return { value: vote?.value ?? null };
    }),
});
