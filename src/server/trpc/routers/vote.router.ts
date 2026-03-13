import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../index";
import { voteSchema, getMyVoteSchema } from "@/lib/validators/board.schema";

export const voteRouter = createTRPCRouter({
  // 투표 토글 (좋아요/싫어요)
  toggle: protectedProcedure.input(voteSchema).mutation(async ({ ctx, input }) => {
    const { value, postId, commentId } = input;
    const userId = ctx.session.user.id!;

    // 기존 투표 조회
    const existing = await ctx.prisma.vote.findFirst({
      where: {
        userId,
        ...(postId ? { postId } : {}),
        ...(commentId ? { commentId } : {}),
      },
    });

    if (existing) {
      if (existing.value === value) {
        // 같은 값 → 취소
        await ctx.prisma.vote.delete({ where: { id: existing.id } });
        return { action: "removed", value: null };
      } else {
        // 다른 값 → 변경
        const updated = await ctx.prisma.vote.update({
          where: { id: existing.id },
          data: { value },
        });
        return { action: "updated", value: updated.value };
      }
    }

    // 신규 투표
    await ctx.prisma.vote.create({
      data: {
        value,
        userId,
        postId: postId ?? null,
        commentId: commentId ?? null,
      },
    });

    // 알림: 게시글 좋아요 (본인 제외, 좋아요만)
    if (postId && value === 1) {
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

    return { action: "created", value };
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
