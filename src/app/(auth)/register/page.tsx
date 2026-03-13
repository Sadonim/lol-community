import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "회원가입 | LOL 커뮤니티" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <RegisterForm />
    </main>
  );
}
