"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TierBadge } from "@/components/profile/TierBadge";

const linkSchema = z.object({
  gameName: z.string().min(1, "게임 이름을 입력해주세요"),
  tagLine: z.string().min(1, "태그를 입력해주세요"),
});

type LinkFormData = z.infer<typeof linkSchema>;

interface RiotAccount {
  gameName: string;
  tagLine: string;
  summonerLevel: number | null;
  profileIconId: number | null;
  tier: string | null;
  rank: string | null;
  leaguePoints: number | null;
  wins: number | null;
  losses: number | null;
  lastSyncedAt: Date;
}

interface Props {
  initialAccount: RiotAccount | null;
}

export function RiotAccountSection({ initialAccount }: Props) {
  const utils = trpc.useUtils();
  const { data: account } = trpc.riot.myAccount.useQuery(undefined, {
    initialData: initialAccount,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
  });

  const link = trpc.riot.link.useMutation({
    onSuccess: () => {
      toast.success("Riot 계정이 연동되었습니다.");
      utils.riot.myAccount.invalidate();
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const unlink = trpc.riot.unlink.useMutation({
    onSuccess: () => {
      toast.success("연동이 해제되었습니다.");
      utils.riot.myAccount.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sync = trpc.riot.sync.useMutation({
    onSuccess: () => {
      toast.success("전적이 동기화되었습니다.");
      utils.riot.myAccount.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riot 계정 연동</CardTitle>
      </CardHeader>
      <CardContent>
        {account ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="font-medium">
                  {account.gameName}#{account.tagLine}
                </p>
                <p className="text-xs text-muted-foreground">
                  마지막 동기화:{" "}
                  {format(new Date(account.lastSyncedAt), "M월 d일 HH:mm", { locale: ko })}
                </p>
              </div>
              <TierBadge tier={account.tier} rank={account.rank} lp={account.leaguePoints} />
              {account.wins !== null && (
                <span className="text-sm text-muted-foreground">
                  {account.wins}승 {account.losses}패
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
              >
                {sync.isPending ? "동기화 중..." : "전적 동기화"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => unlink.mutate()}
                disabled={unlink.isPending}
              >
                연동 해제
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((data) => link.mutate(data))}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Riot ID를 입력하여 게임 계정을 연동하세요.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="gameName">게임 이름</Label>
                <Input id="gameName" placeholder="이름" {...register("gameName")} />
                {errors.gameName && (
                  <p className="text-xs text-destructive">{errors.gameName.message}</p>
                )}
              </div>
              <div className="w-28 space-y-1.5">
                <Label htmlFor="tagLine">태그</Label>
                <Input id="tagLine" placeholder="KR1" {...register("tagLine")} />
                {errors.tagLine && (
                  <p className="text-xs text-destructive">{errors.tagLine.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={link.isPending}>
              {link.isPending ? "연동 중..." : "연동하기"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
