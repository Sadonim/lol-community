import { unstable_cache } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { BoardCard } from "@/components/forum/BoardCard";

export const metadata = { title: "게시판 목록 — LOL 커뮤니티" };

// 게시판 목록은 자주 변경되지 않으므로 60초간 캐시
const getCachedBoards = unstable_cache(
  () =>
    prisma.board.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        _count: { select: { posts: true } },
      },
    }),
  ["boards-list"],
  { revalidate: 60 }
);

export default async function BoardsPage() {
  const boards = await getCachedBoards();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">게시판</h1>

      {boards.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">아직 게시판이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              slug={board.slug}
              name={board.name}
              description={board.description}
              postCount={board._count.posts}
            />
          ))}
        </div>
      )}
    </main>
  );
}
