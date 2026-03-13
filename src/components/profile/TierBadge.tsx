const TIER_COLORS: Record<string, string> = {
  CHALLENGER: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  GRANDMASTER: "text-red-400 bg-red-400/10 border-red-400/30",
  MASTER: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  DIAMOND: "text-blue-300 bg-blue-300/10 border-blue-300/30",
  EMERALD: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  PLATINUM: "text-teal-400 bg-teal-400/10 border-teal-400/30",
  GOLD: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
  SILVER: "text-gray-300 bg-gray-300/10 border-gray-300/30",
  BRONZE: "text-orange-700 bg-orange-700/10 border-orange-700/30",
  IRON: "text-gray-500 bg-gray-500/10 border-gray-500/30",
};

const TIER_KO: Record<string, string> = {
  CHALLENGER: "챌린저",
  GRANDMASTER: "그랜드마스터",
  MASTER: "마스터",
  DIAMOND: "다이아몬드",
  EMERALD: "에메랄드",
  PLATINUM: "플래티넘",
  GOLD: "골드",
  SILVER: "실버",
  BRONZE: "브론즈",
  IRON: "아이언",
};

interface Props {
  tier: string | null;
  rank?: string | null;
  lp?: number | null;
  size?: "sm" | "md";
}

export function TierBadge({ tier, rank, lp, size = "md" }: Props) {
  if (!tier) {
    return (
      <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-muted-foreground border-border">
        언랭크
      </span>
    );
  }

  const colorClass = TIER_COLORS[tier] ?? "text-muted-foreground bg-muted/10 border-border";
  const tierName = TIER_KO[tier] ?? tier;
  const isApex = ["CHALLENGER", "GRANDMASTER", "MASTER"].includes(tier);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-medium ${
        size === "sm" ? "text-xs" : "text-sm"
      } ${colorClass}`}
    >
      {tierName}
      {!isApex && rank && ` ${rank}`}
      {lp !== null && lp !== undefined && ` ${lp} LP`}
    </span>
  );
}
