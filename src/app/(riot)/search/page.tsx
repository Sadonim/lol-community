import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchForm } from "@/components/riot/SearchForm";

export const metadata: Metadata = {
  title: "전적 검색",
  description: "Riot ID로 소환사의 전적, 랭크, 프로필을 검색하세요.",
};

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">전적 검색</h1>
        <p className="text-muted-foreground">
          Riot ID (예: Hide on bush#KR1)로 소환사를 검색하세요
        </p>
      </div>

      <Suspense>
        <SearchForm />
      </Suspense>
    </div>
  );
}
