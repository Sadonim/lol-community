import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCaller } from "@/server/trpc/caller";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { RiotAccountSection } from "@/components/settings/RiotAccountSection";

export const metadata = { title: "설정 — LOL 커뮤니티" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const caller = await getCaller();
  const [me, riotAccount] = await Promise.all([
    caller.auth.me(),
    caller.riot.myAccount(),
  ]);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      <div className="space-y-6">
        <ProfileForm defaultValues={{ username: me.username, avatarUrl: me.avatarUrl }} />
        <PasswordForm />
        <RiotAccountSection initialAccount={riotAccount} />
      </div>
    </main>
  );
}
