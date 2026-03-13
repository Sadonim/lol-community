"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  name: string;
  clickable?: boolean;
}

export function TagBadge({ name, clickable = false }: TagBadgeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleClick = () => {
    if (!clickable) return;
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tag") === name) {
      params.delete("tag");
    } else {
      params.set("tag", name);
      params.set("page", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Badge
      variant="secondary"
      className={clickable ? "cursor-pointer hover:bg-secondary/80" : ""}
      onClick={clickable ? handleClick : undefined}
    >
      {name}
    </Badge>
  );
}
