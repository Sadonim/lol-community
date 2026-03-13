"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({ postId, parentId, onSuccess, onCancel, placeholder }: CommentFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");

  const utils = trpc.useUtils();

  const create = trpc.comment.create.useMutation({
    onSuccess: () => {
      setContent("");
      utils.comment.listByPost.invalidate({ postId });
      onSuccess?.();
      toast.success(parentId ? "답글이 등록되었습니다." : "댓글이 등록되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!session) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        댓글을 작성하려면{" "}
        <button
          className="text-primary underline"
          onClick={() => router.push("/login")}
        >
          로그인
        </button>
        이 필요합니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? "댓글을 입력하세요"}
        className="resize-none min-h-[80px]"
        maxLength={1000}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{content.length}/1000</span>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>취소</Button>
          )}
          <Button
            size="sm"
            onClick={() => create.mutate({ postId, content, parentId })}
            disabled={!content.trim() || create.isPending}
          >
            {create.isPending ? "등록 중..." : "등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}
