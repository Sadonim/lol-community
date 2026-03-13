"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BoardCardProps {
  slug: string;
  name: string;
  description?: string | null;
  postCount: number;
}

export function BoardCard({ slug, name, description, postCount }: BoardCardProps) {
  return (
    <Link href={`/boards/${slug}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent>
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
          )}
          <p className="text-xs text-muted-foreground">게시글 {postCount.toLocaleString()}개</p>
        </CardContent>
      </Card>
    </Link>
  );
}
