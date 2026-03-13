import { notFound } from "next/navigation";
import { getCaller } from "@/server/trpc/caller";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { UserPostList } from "@/components/profile/UserPostList";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `${decodeURIComponent(username)} — LOL 커뮤니티` };
}

export default async function ProfilePage({ params }: Props) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const caller = await getCaller();

  let user;
  try {
    user = await caller.user.getProfile({ username });
  } catch {
    notFound();
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <ProfileCard user={user} />
      <UserPostList posts={user.posts} />
    </main>
  );
}
