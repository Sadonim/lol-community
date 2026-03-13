import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCaller } from "@/server/trpc/caller";
import { PostContent } from "@/components/forum/PostContent";
import { CommentSection } from "@/components/forum/CommentSection";

interface Props {
  params: Promise<{ slug: string; postId: string }>;
}

// 같은 요청 내 generateMetadata + PostPage 간 중복 DB 조회 제거
const getPost = cache(async (postId: string) => {
  const caller = await getCaller();
  return caller.post.getById({ postId }).catch(() => null);
});

export async function generateMetadata({ params }: Props) {
  const { postId } = await params;
  const post = await getPost(postId);
  return { title: post ? `${post.title} — LOL 커뮤니티` : "게시글" };
}

export default async function PostPage({ params }: Props) {
  const { slug, postId } = await params;

  const post = await getPost(postId);
  if (!post) notFound();

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href={`/boards/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        {post.board.name}
      </Link>

      <PostContent post={post as any} />
      <CommentSection postId={postId} />
    </main>
  );
}
