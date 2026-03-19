const RIOT_API_KEY = process.env.RIOT_API_KEY!;
const ACCOUNT_BASE = "https://asia.api.riotgames.com";
const SUMMONER_BASE = "https://kr.api.riotgames.com";

// 최신 버전 캐시 (서버 재시작 시마다 갱신)
let cachedDdragonVersion: string | null = null;

async function getDdragonVersion(): Promise<string> {
  if (cachedDdragonVersion) return cachedDdragonVersion;
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 3600 }, // 1시간 캐시
    });
    const versions = (await res.json()) as string[];
    cachedDdragonVersion = versions[0] ?? "15.1.1";
  } catch {
    cachedDdragonVersion = "15.1.1";
  }
  return cachedDdragonVersion;
}

// ── Error class ───────────────────────────────────────────────────────────────

export class RiotApiError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "RATE_LIMITED" | "FORBIDDEN" | "API_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

const RIOT_FETCH_TIMEOUT_MS = 5000;

async function riotFetch<T>(url: string): Promise<T> {
  // API 키 미설정 시 무음 실패 방지: 명시적 오류 반환
  if (!process.env.RIOT_API_KEY) {
    throw new RiotApiError("FORBIDDEN", "Riot API 키가 설정되지 않았습니다. 관리자에게 문의하세요.");
  }

  // 타임아웃 적용 (무한 대기 방지)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RIOT_FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-Riot-Token": process.env.RIOT_API_KEY },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new RiotApiError("API_ERROR", "Riot API 요청 시간이 초과되었습니다.");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 404)
    throw new RiotApiError("NOT_FOUND", "소환사를 찾을 수 없습니다.");
  if (res.status === 429)
    throw new RiotApiError("RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
  if (res.status === 403)
    throw new RiotApiError("FORBIDDEN", "API 키가 만료되었습니다. 관리자에게 문의하세요.");
  if (!res.ok)
    throw new RiotApiError("API_ERROR", `Riot API 오류: ${res.status}`);

  return res.json() as Promise<T>;
}

// ── API response types ────────────────────────────────────────────────────────

interface RiotAccountResponse {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface SummonerResponse {
  profileIconId: number;
  summonerLevel: number;
}

interface LeagueEntryResponse {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

// ── Public API functions ──────────────────────────────────────────────────────

export async function fetchRiotAccount(
  gameName: string,
  tagLine: string,
): Promise<RiotAccountResponse> {
  return riotFetch<RiotAccountResponse>(
    `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  );
}

export async function fetchSummonerByPuuid(puuid: string): Promise<SummonerResponse> {
  return riotFetch<SummonerResponse>(
    `${SUMMONER_BASE}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
  );
}

// Riot API: summonerId 대신 PUUID 기반 엔드포인트 사용
export async function fetchLeagueEntries(puuid: string): Promise<LeagueEntryResponse[]> {
  return riotFetch<LeagueEntryResponse[]>(
    `${SUMMONER_BASE}/lol/league/v4/entries/by-puuid/${puuid}`,
  );
}

// ── Composite return type ─────────────────────────────────────────────────────

export interface FullSummonerData {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerLevel: number;
  profileIconId: number;
  profileIconUrl: string;
  tier: string | null;
  rank: string | null;
  leaguePoints: number;
  wins: number;
  losses: number;
  rankDisplay: string | null;
  winRate: number | null;
}

const TIER_KO: Record<string, string> = {
  IRON: "아이언",
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  EMERALD: "에메랄드",
  DIAMOND: "다이아몬드",
  MASTER: "마스터",
  GRANDMASTER: "그랜드마스터",
  CHALLENGER: "챌린저",
};

export async function fetchFullSummonerData(
  gameName: string,
  tagLine: string,
): Promise<FullSummonerData> {
  const account = await fetchRiotAccount(gameName, tagLine);
  // summoner와 entries는 account.puuid만 필요하므로 병렬 호출 (L-10)
  const [summoner, entries] = await Promise.all([
    fetchSummonerByPuuid(account.puuid),
    fetchLeagueEntries(account.puuid),
  ]);

  const soloEntry = entries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;

  const tier = soloEntry?.tier ?? null;
  const rank = soloEntry?.rank ?? null;
  const leaguePoints = soloEntry?.leaguePoints ?? 0;
  const wins = soloEntry?.wins ?? 0;
  const losses = soloEntry?.losses ?? 0;

  const rankDisplay =
    tier && rank ? `${TIER_KO[tier] ?? tier} ${rank} ${leaguePoints}LP` : null;

  const totalGames = wins + losses;
  const winRate =
    totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : null;

  return {
    puuid: account.puuid,
    gameName: account.gameName,
    tagLine: account.tagLine,
    summonerLevel: summoner.summonerLevel,
    profileIconId: summoner.profileIconId,
    profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${await getDdragonVersion()}/img/profileicon/${summoner.profileIconId}.png`,
    tier,
    rank,
    leaguePoints,
    wins,
    losses,
    rankDisplay,
    winRate,
  };
}
