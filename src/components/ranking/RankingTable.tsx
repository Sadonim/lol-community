import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TierBadge } from "@/components/profile/TierBadge";

interface RankEntry {
  rank_position: number;
  gameName: string;
  tagLine: string;
  tier: string | null;
  rank: string | null;
  leaguePoints: number | null;
  wins: number | null;
  losses: number | null;
  user: { username: string; avatarUrl: string | null };
}

interface Props {
  entries: RankEntry[];
}

export function RankingTable({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-16">
        랭킹에 등록된 소환사가 없습니다.
      </p>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">소환사</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">티어</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">
              승률
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((entry) => {
            const total = (entry.wins ?? 0) + (entry.losses ?? 0);
            const winRate = total > 0 ? Math.round(((entry.wins ?? 0) / total) * 100) : null;

            return (
              <tr key={entry.gameName + entry.tagLine} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground font-mono">
                  {entry.rank_position <= 3 ? (
                    <span
                      className={
                        entry.rank_position === 1
                          ? "text-yellow-500 font-bold"
                          : entry.rank_position === 2
                          ? "text-gray-400 font-bold"
                          : "text-orange-600 font-bold"
                      }
                    >
                      {entry.rank_position}
                    </span>
                  ) : (
                    entry.rank_position
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/profile/${entry.user.username}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={entry.user.avatarUrl ?? ""} />
                      <AvatarFallback className="text-xs">
                        {entry.user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{entry.user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.gameName}#{entry.tagLine}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={entry.tier} rank={entry.rank} lp={entry.leaguePoints} size="sm" />
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  {winRate !== null ? (
                    <span
                      className={
                        winRate >= 60
                          ? "text-blue-500 font-medium"
                          : winRate <= 40
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {entry.wins}승 {entry.losses}패{" "}
                      <span className="text-foreground">({winRate}%)</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
