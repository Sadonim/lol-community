import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../index";
import {
  createCommentSchema,
  deleteCommentSchema,
  listCommentsByPostSchema,
} from "@/lib/validators/board.schema";

export const commentRouter = createTRPCRouter({
  // 게시글의 댓글 목록 (대댓글 포함)
  listByPost: publicProcedure
    .input(listCommentsByPostSchema)
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        where: { postId: input.postId, parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          votes: { select: { value: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, username: true, avatarUrl: true } },
              votes: { select: { value: true } },
            },
          },
        },
      });

      return comments.map((comment) => ({
        ...comment,
        voteSum: comment.votes.reduce((sum, v) => sum + v.value, 0),
        votes: undefined,
        replies: comment.replies.map((reply) => ({
          ...reply,
          voteSum: reply.votes.reduce((sum, v) => sum + v.value, 0),
          votes: undefined,
        })),
      }));
    }),

  // 댓글 작성
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { postId, content, parentId } = input;
      const actorId = ctx.session.user.id!;

      // 게시글 존재 확인
      const post = await ctx.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true, authorId: true, board: { select: { slug: true } } },
      });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다." });
      }

      // 대댓글인 경우 유효성 확인
      let parentComment: { postId: string; parentId: string | null; authorId: string } | null = null;
      if (parentId) {
        parentComment = await ctx.prisma.comment.findUnique({
          where: { id: parentId },
          select: { postId: true, parentId: true, authorId: true },
        });

        if (!parentComment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "원댓글을 찾을 수 없습니다." });
        }
        if (parentComment.postId !== postId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "잘못된 댓글입니다." });
        }
        // 1-depth 제한: 대댓글의 대댓글 금지
        if (parentComment.parentId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "대댓글에는 답글을 달 수 없습니다.",
          });
        }
      }

      const comment = await ctx.prisma.comment.create({
        data: {
          content,
          postId,
          authorId: actorId,
          parentId: parentId ?? null,
        },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      const postUrl = `/boards/${post.board.slug}/${postId}`;

      // 알림 생성: 내 글에 댓글 달릴 때 (본인 제외)
      if (post.authorId !== actorId) {
        await ctx.prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "COMMENT_REPLY",
            title: "새 댓글이 달렸습니다",
            body: `"${post.title}" 게시글에 댓글이 달렸습니다.`,
            linkUrl: postUrl,
          },
        });
      }

      // 알림 생성: 내 댓글에 대댓글 달릴 때 (본인 제외, 글 작성자와 중복 방지)
      if (parentComment && parentComment.authorId !== actorId && parentComment.authorId !== post.authorId) {
        await ctx.prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            type: "COMMENT_REPLY",
            title: "답글이 달렸습니다",
            body: `회원님의 댓글에 답글이 달렸습니다.`,
            linkUrl: postUrl,
          },
        });
      }

      return comment;
    }),

  // 댓글 삭제 (본인 or ADMIN/MODERATOR)
  delete: protectedProcedure
    .input(deleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { authorId: true },
      });

      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "댓글을 찾을 수 없습니다." });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      const canDelete =
        comment.authorId === ctx.session.user.id ||
        user?.role === "ADMIN" ||
        user?.role === "MODERATOR";

      if (!canDelete) {
        throw new TRPCError({ code: "FORBIDDEN", message: "삭제 권한이 없습니다." });
      }

      await ctx.prisma.comment.delete({ where: { id: input.commentId } });
      return { success: true };
    }),
});
