"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummonerCard } from "./SummonerCard";
import { Search } from "lucide-react";

export function SearchForm() {
  const { data: session } = useSession();
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState<{ gameName: string; tagLine: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const searchQuery = trpc.riot.search.useQuery(
    submitted ?? { gameName: "", tagLine: "" },
    {
      enabled: !!submitted,
      retry: false,
      staleTime: 30_000,
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);

    const trimmed = inputValue.trim();
    const hashIndex = trimmed.lastIndexOf("#");

    if (hashIndex === -1) {
      setParseError("Riot ID는 # 기호를 포함해야 합니다. (예: Hide on bush#KR1)");
      return;
    }

    const gameName = trimmed.slice(0, hashIndex).trim();
    const tagLine = trimmed.slice(hashIndex + 1).trim();

    if (!gameName || !tagLine) {
      setParseError("게임 이름과 태그라인을 모두 입력해주세요.");
      return;
    }

    setSubmitted({ gameName, tagLine });
  };

  const isLoading = searchQuery.isFetching;
  const error = parseError ?? (searchQuery.error?.message ?? null);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>소환사 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="riotId">Riot ID</Label>
              <div className="flex gap-2">
                <Input
                  id="riotId"
                  placeholder="Hide on bush#KR1"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setParseError(null);
                  }}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? (
                    "검색 중..."
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      검색
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                게임 이름과 태그라인을 # 으로 구분하여 입력하세요.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchQuery.data && (
        <SummonerCard
          data={searchQuery.data}
          isLoggedIn={!!session?.user}
          mode="search"
        />
      )}
    </div>
  );
}
