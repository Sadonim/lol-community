"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Link2, Link2Off, ShieldCheck, User } from "lucide-react";
import type { FullSummonerData } from "@/server/services/riot.service";

const TIER_COLOURS: Record<string, string> = {
  IRON: "bg-zinc-600 text-white",
  BRONZE: "bg-amber-800 text-white",
  SILVER: "bg-slate-400 text-white",
  GOLD: "bg-yellow-500 text-white",
  PLATINUM: "bg-teal-500 text-white",
  EMERALD: "bg-emerald-500 text-white",
  DIAMOND: "bg-blue-500 text-white",
  MASTER: "bg-purple-600 text-white",
  GRANDMASTER: "bg-red-600 text-white",
  CHALLENGER: "bg-sky-400 text-white",
};

interface SummonerCardProps {
  data: FullSummonerData;
  isLoggedIn: boolean;
  mode?: "search" | "profile";
}

export function SummonerCard({ data, isLoggedIn, mode = "search" }: SummonerCardProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [localError, setLocalError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const link = trpc.riot.link.useMutation({
    onSuccess: () => {
      toast.success(`${data.gameName}#${data.tagLine} 계정이 연동되었습니다.`);
      void utils.riot.myAccount.invalidate();
      void utils.auth.me.invalidate();
      router.refresh();
    },
    onError: (err) => setLocalError(err.message),
  });

  const unlink = trpc.riot.unlink.useMutation({
    onSuccess: () => {
      toast.success("Riot 계정 연동이 해제되었습니다.");
      void utils.riot.myAccount.invalidate();
      void utils.auth.me.invalidate();
      router.refresh();
    },
    onError: (err) => setLocalError(err.message),
  });

  const sync = trpc.riot.sync.useMutation({
    onSuccess: () => {
      toast.success("전적이 최신 정보로 업데이트되었습니다.");
      void utils.riot.myAccount.invalidate();
    },
    onError: (err) => setLocalError(err.message),
  });

  const tierColour = data.tier
    ? (TIER_COLOURS[data.tier] ?? "bg-muted text-muted-foreground")
    : "";
  const isAnyPending = link.isPending || unlink.isPending || sync.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-muted">
            {imgError ? (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={data.profileIconUrl}
                alt={`${data.gameName} 프로필 아이콘`}
                fill
                sizes="64px"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-xl">
              {data.gameName}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                #{data.tagLine}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">레벨 {data.summonerLevel}</p>
          </div>

          {data.rankDisplay ? (
            <Badge className={tierColour}>{data.rankDisplay}</Badge>
          ) : (
            <Badge variant="outline">언랭크</Badge>
          )}
        </div>
      </CardHeader>

      {data.tier && (
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold">{data.wins}승</div>
              <div className="text-muted-foreground">승리</div>
            </div>
            <div>
              <div className="font-semibold">{data.losses}패</div>
              <div className="text-muted-foreground">패배</div>
            </div>
            <div>
              <div className="font-semibold">
                {data.winRate !== null ? `${data.winRate}%` : "-"}
              </div>
              <div className="text-muted-foreground">승률</div>
            </div>
          </div>

          {localError && (
            <div className="mt-3 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {localError}
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="flex-wrap gap-2">
        {isLoggedIn && mode === "search" && (
          <Button
            size="sm"
            disabled={isAnyPending}
            onClick={() => {
              setLocalError(null);
              link.mutate({ gameName: data.gameName, tagLine: data.tagLine });
            }}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {link.isPending ? "연동 중..." : "내 계정에 연동"}
          </Button>
        )}

        {!isLoggedIn && mode === "search" && (
          <Button size="sm" variant="outline" onClick={() => router.push("/login")}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            로그인 후 연동
          </Button>
        )}

        {mode === "profile" && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={isAnyPending}
              onClick={() => {
                setLocalError(null);
                sync.mutate();
              }}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
              {sync.isPending ? "동기화 중..." : "전적 동기화"}
            </Button>

            <Button
              size="sm"
              variant="destructive"
              disabled={isAnyPending}
              onClick={() => {
                setLocalError(null);
                unlink.mutate();
              }}
            >
              <Link2Off className="mr-2 h-4 w-4" />
              {unlink.isPending ? "해제 중..." : "연동 해제"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
