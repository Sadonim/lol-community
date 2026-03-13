import { getCaller } from "@/server/trpc/caller";
import { RankingTable } from "@/components/ranking/RankingTable";

export const metadata = { title: "랭킹 — LOL 커뮤니티" };

export default async function RankingPage() {
  const caller = await getCaller();
  const entries = await caller.riot.getRanking();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">랭킹</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Riot 계정을 연동한 소환사들의 랭크 순위입니다.
        </p>
      </div>
      <RankingTable entries={entries} />
    </main>
  );
}
