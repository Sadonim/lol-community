import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../index";
import {
  createPostSchema,
  updatePostSchema,
  listPostsSchema,
  getPostByIdSchema,
  deletePostSchema,
} from "@/lib/validators/board.schema";

export const postRouter = createTRPCRouter({
  // 게시글 목록 (페이지네이션 + 정렬 + 태그 필터)
  list: publicProcedure.input(listPostsSchema).query(async ({ ctx, input }) => {
    const { boardSlug, page, limit, sort, tagName } = input;
    const skip = (page - 1) * limit;

    const orderBy =
      sort === "views"
        ? { viewCount: "desc" as const }
        : sort === "popular"
          ? { votes: { _count: "desc" as const } }
          : { createdAt: "desc" as const };

    const where = {
      board: { slug: boardSlug },
      ...(tagName ? { tags: { some: { tag: { name: tagName } } } } : {}),
    };

    const [posts, total] = await ctx.prisma.$transaction([
      ctx.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          isPinned: true,
          viewCount: true,
          createdAt: true,
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { comments: true, votes: true } },
          tags: { select: { tag: { select: { name: true } } } },
          votes: { select: { value: true } },
        },
      }),
      ctx.prisma.post.count({ where }),
    ]);

    const postsWithScore = posts.map((post) => ({
      ...post,
      voteSum: post.votes.reduce((sum, v) => sum + v.value, 0),
      votes: undefined,
    }));

    return {
      posts: postsWithScore,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }),

  // 게시글 상세 + 조회수 증가
  getById: publicProcedure.input(getPostByIdSchema).query(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findUnique({
      where: { id: input.postId },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, role: true } },
        board: { select: { id: true, slug: true, name: true } },
        tags: { select: { tag: { select: { name: true } } } },
        votes: { select: { value: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!post) {
      throw new TRPCError({ code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다." });
    }

    // 조회수 증가 (비동기, 응답 대기 안 함)
    ctx.prisma.post.update({
      where: { id: input.postId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return {
      ...post,
      voteSum: post.votes.reduce((sum, v) => sum + v.value, 0),
      votes: undefined,
    };
  }),

  // 게시글 작성
  create: protectedProcedure.input(createPostSchema).mutation(async ({ ctx, input }) => {
    const { boardId, title, content, tagNames } = input;

    const board = await ctx.prisma.board.findUnique({ where: { id: boardId } });
    if (!board || !board.isActive) {
      throw new TRPCError({ code: "NOT_FOUND", message: "게시판을 찾을 수 없습니다." });
    }

    const post = await ctx.prisma.post.create({
      data: {
        title,
        content,
        authorId: ctx.session.user.id!,
        boardId,
        tags: {
          create: tagNames.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        },
      },
      select: { id: true, board: { select: { slug: true } } },
    });

    return post;
  }),

  // 게시글 수정 (본인만)
  update: protectedProcedure.input(updatePostSchema).mutation(async ({ ctx, input }) => {
    const { postId, title, content, tagNames } = input;

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new TRPCError({ code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다." });
    }
    if (post.authorId !== ctx.session.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "수정 권한이 없습니다." });
    }

    // 기존 태그 삭제 후 재생성 — 트랜잭션으로 원자적 처리
    return ctx.prisma.$transaction(async (tx) => {
      await tx.postTag.deleteMany({ where: { postId } });

      return tx.post.update({
        where: { id: postId },
        data: {
          title,
          content,
          tags: {
            create: tagNames.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
        },
        select: { id: true, board: { select: { slug: true } } },
      });
    });
  }),

  // 게시글 삭제 (본인 or ADMIN/MODERATOR)
  delete: protectedProcedure.input(deletePostSchema).mutation(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findUnique({
      where: { id: input.postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new TRPCError({ code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다." });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { role: true },
    });

    const canDelete =
      post.authorId === ctx.session.user.id ||
      user?.role === "ADMIN" ||
      user?.role === "MODERATOR";

    if (!canDelete) {
      throw new TRPCError({ code: "FORBIDDEN", message: "삭제 권한이 없습니다." });
    }

    await ctx.prisma.post.delete({ where: { id: input.postId } });
    return { success: true };
  }),
});
