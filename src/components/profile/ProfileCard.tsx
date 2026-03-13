import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TierBadge } from "./TierBadge";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "관리자",
  MODERATOR: "모더레이터",
  USER: "일반",
};

interface Props {
  user: {
    username: string;
    avatarUrl: string | null;
    role: string;
    createdAt: Date;
    riotAccount: {
      gameName: string;
      tagLine: string;
      tier: string | null;
      rank: string | null;
      leaguePoints: number | null;
      wins: number | null;
      losses: number | null;
      profileIconId: number | null;
      summonerLevel: number | null;
    } | null;
    _count: { posts: number; comments: number };
  };
}

export function ProfileCard({ user }: Props) {
  const winRate =
    user.riotAccount && (user.riotAccount.wins ?? 0) + (user.riotAccount.losses ?? 0) > 0
      ? Math.round(
          ((user.riotAccount.wins ?? 0) /
            ((user.riotAccount.wins ?? 0) + (user.riotAccount.losses ?? 0))) *
            100
        )
      : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl ?? ""} />
            <AvatarFallback className="text-2xl">
              {user.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              {user.role !== "USER" && (
                <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              가입일: {format(new Date(user.createdAt), "yyyy년 M월 d일", { locale: ko })}
            </p>

            <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start text-sm">
              <span className="text-muted-foreground">
                게시글 <span className="font-semibold text-foreground">{user._count.posts}</span>
              </span>
              <span className="text-muted-foreground">
                댓글 <span className="font-semibold text-foreground">{user._count.comments}</span>
              </span>
            </div>
          </div>
        </div>

        {user.riotAccount && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-sm font-medium">
                  {user.riotAccount.gameName}#{user.riotAccount.tagLine}
                </p>
                <p className="text-xs text-muted-foreground">
                  소환사 레벨 {user.riotAccount.summonerLevel}
                </p>
              </div>
              <TierBadge
                tier={user.riotAccount.tier}
                rank={user.riotAccount.rank}
                lp={user.riotAccount.leaguePoints}
              />
              {winRate !== null && (
                <span className="text-sm text-muted-foreground">
                  {user.riotAccount.wins}승 {user.riotAccount.losses}패{" "}
                  <span className="font-medium text-foreground">({winRate}%)</span>
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
