import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCaller } from "@/server/trpc/caller";
import { PostForm } from "@/components/forum/PostForm";

interface Props {
  params: Promise<{ slug: string; postId: string }>;
}

export const metadata = { title: "게시글 수정 — LOL 커뮤니티" };

export default async function EditPostPage({ params }: Props) {
  const { slug, postId } = await params;

  const caller = await getCaller();
  const [session, post] = await Promise.all([
    auth(),
    caller.post.getById({ postId }).catch(() => null),
  ]);

  if (!session) redirect(`/login`);
  if (!post) notFound();

  if (post.author.id !== session.user?.id) redirect(`/boards/${slug}/${postId}`);

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">게시글 수정</h1>
      <PostForm
        mode="edit"
        postId={postId}
        boardSlug={slug}
        initialData={{
          title: post.title,
          content: post.content,
          tagNames: post.tags.map((pt) => pt.tag.name),
        }}
      />
    </main>
  );
}
