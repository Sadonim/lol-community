import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";

export const notificationRouter = createTRPCRouter({
  // 알림 목록 조회 (최신순, 최대 30개)
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 30;
      const userId = ctx.session.user.id!;

      const notifications = await ctx.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return notifications;
    }),

  // 읽지 않은 알림 수
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.session.user.id!,
        isRead: false,
      },
    });
    return { count };
  }),

  // 단일 알림 읽음 처리
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.updateMany({
        where: { id: input.id, userId: ctx.session.user.id! },
        data: { isRead: true },
      });
      return { success: true };
    }),

  // 전체 읽음 처리
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.session.user.id!, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }),
});
