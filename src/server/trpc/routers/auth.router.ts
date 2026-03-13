import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../index";
import { registerSchema } from "@/lib/validators/auth.schema";

export const authRouter = createTRPCRouter({
  // 회원가입
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, username, password } = input;

      // 이메일 중복 확인
      const existingEmail = await ctx.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 사용 중인 이메일입니다.",
        });
      }

      // 닉네임 중복 확인
      const existingUsername = await ctx.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existingUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 사용 중인 닉네임입니다.",
        });
      }

      // 비밀번호 해싱
      const passwordHash = await bcrypt.hash(password, 12);

      // 유저 생성
      const user = await ctx.prisma.user.create({
        data: { email, username, passwordHash },
        select: { id: true, email: true, username: true, createdAt: true },
      });

      return { success: true, user };
    }),

  // 현재 로그인한 유저 정보
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
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
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "유저를 찾을 수 없습니다." });
    }

    return user;
  }),
});
