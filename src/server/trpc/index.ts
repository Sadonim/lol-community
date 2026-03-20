import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";

// =============================================
// Context 생성
// =============================================

export const createTRPCContext = async (opts: { req: NextRequest }) => {
  const session = await auth();

  return {
    session,
    prisma,
    req: opts.req,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// =============================================
// tRPC 초기화
// =============================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// =============================================
// 미들웨어
// =============================================

// 로그인 필수 미들웨어 (DB에서 유저 존재 여부도 확인 → 탈퇴한 유저의 JWT 차단)
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "로그인이 필요합니다.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { id: true },
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "존재하지 않는 계정입니다. 다시 로그인해주세요.",
    });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// 어드민 전용 미들웨어
const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }

  return next({ ctx: { session: { ...ctx.session, user: ctx.session.user } } });
});

// =============================================
// 라우터 & 프로시저 내보내기
// =============================================

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
