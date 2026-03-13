"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PostListItem } from "./PostListItem";
import { Pagination } from "./Pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
  id: string;
  title: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: Date;
  author: { username: string };
  _count: { comments: number };
  voteSum: number;
  tags: { tag: { name: string } }[];
}

interface PostListProps {
  boardSlug: string;
  posts: Post[];
  currentPage: number;
  totalPages: number;
  currentSort: string;
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: "latest", label: "최신" },
  { value: "popular", label: "인기" },
  { value: "views", label: "조회수" },
] as const;

export function PostList({
  boardSlug,
  posts,
  currentPage,
  totalPages,
  currentSort,
  isLoading,
}: PostListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const changeSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* 정렬 탭 */}
      <div className="flex gap-1 mb-2 border-b">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => changeSort(opt.value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentSort === opt.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">아직 게시글이 없습니다.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostListItem
              key={post.id}
              id={post.id}
              boardSlug={boardSlug}
              title={post.title}
              isPinned={post.isPinned}
              viewCount={post.viewCount}
              createdAt={post.createdAt}
              author={post.author}
              commentCount={post._count.comments}
              voteSum={post.voteSum}
              tags={post.tags}
            />
          ))}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
