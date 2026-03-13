import { createTRPCRouter } from "./index";
import { authRouter } from "./routers/auth.router";
import { riotRouter } from "./routers/riot.router";
import { boardRouter } from "./routers/board.router";
import { postRouter } from "./routers/post.router";
import { commentRouter } from "./routers/comment.router";
import { voteRouter } from "./routers/vote.router";
import { notificationRouter } from "./routers/notification.router";
import { userRouter } from "./routers/user.router";

// =============================================
// 루트 라우터 — 모든 서브 라우터를 여기서 합침
// =============================================

export const appRouter = createTRPCRouter({
  auth: authRouter,
  riot: riotRouter,
  board: boardRouter,
  post: postRouter,
  comment: commentRouter,
  vote: voteRouter,
  notification: notificationRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
