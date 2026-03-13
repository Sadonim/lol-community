import { cache } from "react";
import { headers } from "next/headers";
import { createCallerFactory } from "./index";
import { appRouter } from "./router";
import { createTRPCContext } from "./index";

const createCaller = createCallerFactory(appRouter);

// 요청마다 호출해서 사용: const caller = await getCaller();
export const getCaller = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  const ctx = await createTRPCContext({ req: { headers: heads } as any });
  return createCaller(ctx);
});
