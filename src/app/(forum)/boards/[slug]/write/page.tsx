import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCaller } from "@/server/trpc/caller";
import { PostForm } from "@/components/forum/PostForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata = { title: "글쓰기 — LOL 커뮤니티" };

export default async function WritePage({ params }: Props) {
  const { slug } = await params;

  const caller = await getCaller();
  const [session, board] = await Promise.all([
    auth(),
    caller.board.getBySlug({ slug }).catch(() => null),
  ]);

  if (!session) redirect(`/login?callbackUrl=/boards/${slug}/write`);
  if (!board) notFound();

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">글쓰기</h1>
      <PostForm mode="create" boardId={board.id} boardSlug={slug} />
    </main>
  );
}
