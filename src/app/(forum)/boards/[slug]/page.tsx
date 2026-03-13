import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCaller } from "@/server/trpc/caller";
import { PostList } from "@/components/forum/PostList";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; tag?: string }>;
}

export default async function BoardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr, sort = "latest", tag } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const caller = await getCaller();
  const sortParam = (sort as "latest" | "popular" | "views") || "latest";

  // board + posts + session 모두 병렬 처리 (순차 대기 제거)
  const [board, postsResult, session] = await Promise.all([
    caller.board.getBySlug({ slug }).catch(() => null),
    caller.post.list({ boardSlug: slug, page, limit: 20, sort: sortParam, tagName: tag }),
    auth(),
  ]);

  if (!board) notFound();

  const { posts, total, totalPages } = postsResult;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{board.name}</h1>
          {board.description && (
            <p className="text-muted-foreground text-sm mt-1">{board.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">총 {total}개 게시글</p>
        </div>
        {session && (
          <Button asChild>
            <Link href={`/boards/${slug}/write`}>글쓰기</Link>
          </Button>
        )}
      </div>

      <PostList
        boardSlug={slug}
        posts={posts as any}
        currentPage={page}
        totalPages={totalPages}
        currentSort={sortParam}
      />
    </main>
  );
}
