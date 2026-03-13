"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">LOL</span>
          <span>커뮤니티</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/boards" className="text-muted-foreground hover:text-foreground transition-colors">
            게시판
          </Link>
          <Link href="/ranking" className="text-muted-foreground hover:text-foreground transition-colors">
            랭킹
          </Link>
          <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
            전적 검색
          </Link>
        </nav>

        {/* 유저 영역 */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? ""} />
                    <AvatarFallback>
                      {session.user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">{session.user.name}</div>
                <div className="px-2 pb-1.5 text-xs text-muted-foreground">{session.user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/profile/${session.user?.name}`)}>
                  내 프로필
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                로그인
              </Button>
              <Button size="sm" onClick={() => router.push("/register")}>
                회원가입
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
