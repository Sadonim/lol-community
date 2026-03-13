import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const features = [
    {
      title: "전적 검색",
      description: "Riot ID로 소환사 전적, 랭크, 챔피언 숙련도를 확인하세요.",
      href: "/search",
      icon: "🔍",
    },
    {
      title: "랭킹",
      description: "등록된 소환사들의 글로벌 랭킹을 확인하세요.",
      href: "/ranking",
      icon: "🏆",
    },
    {
      title: "커뮤니티",
      description: "챔피언 토론, 공략, 자유게시판에서 소통하세요.",
      href: "/boards",
      icon: "💬",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      {/* 히어로 섹션 */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          <span className="text-primary">LOL</span> 커뮤니티
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          리그오브레전드 전적 검색, 랭킹, 커뮤니티를 한 곳에서
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/search">전적 검색하기</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/boards">게시판 보기</Link>
          </Button>
        </div>
      </section>

      {/* 기능 카드 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="text-3xl mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
