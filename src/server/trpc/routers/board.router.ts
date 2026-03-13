import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure, publicProcedure } from "../index";
import { createBoardSchema } from "@/lib/validators/board.schema";
import { z } from "zod";

export const boardRouter = createTRPCRouter({
  // 모든 활성 게시판 목록
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.board.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    });
  }),

  // slug로 게시판 단건 조회
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const board = await ctx.prisma.board.findUnique({
        where: { slug: input.slug },
      });

      if (!board) {
        throw new TRPCError({ code: "NOT_FOUND", message: "게시판을 찾을 수 없습니다." });
      }

      return board;
    }),

  // 게시판 생성 (관리자 전용)
  create: adminProcedure
    .input(createBoardSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.board.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 슬러그입니다." });
      }

      return ctx.prisma.board.create({ data: input });
    }),
});
