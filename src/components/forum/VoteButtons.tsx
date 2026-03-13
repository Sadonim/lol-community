"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  targetType: "post" | "comment";
  targetId: string;
  initialSum: number;
  initialMyVote?: number | null;
}

export function VoteButtons({ targetType, targetId, initialSum, initialMyVote }: VoteButtonsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sum, setSum] = useState(initialSum);
  const [myVote, setMyVote] = useState<number | null>(initialMyVote ?? null);

  const toggle = trpc.vote.toggle.useMutation({
    onMutate: ({ value }) => {
      // Optimistic update
      if (myVote === value) {
        setSum((s) => s - value);
        setMyVote(null);
      } else {
        setSum((s) => s - (myVote ?? 0) + value);
        setMyVote(value);
      }
    },
    onError: () => {
      toast.error("투표에 실패했습니다.");
      // 롤백은 서버 상태로 refetch
    },
  });

  const handleVote = (value: 1 | -1) => {
    if (!session) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    toggle.mutate({
      value,
      postId: targetType === "post" ? targetId : undefined,
      commentId: targetType === "comment" ? targetId : undefined,
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 px-2", myVote === 1 && "text-primary")}
        onClick={() => handleVote(1)}
        disabled={toggle.isPending}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <span className={cn("text-sm font-medium min-w-[2rem] text-center", sum > 0 && "text-primary", sum < 0 && "text-destructive")}>
        {sum}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 px-2", myVote === -1 && "text-destructive")}
        onClick={() => handleVote(-1)}
        disabled={toggle.isPending}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
