"use client";

import { MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data: comments, isLoading } = trpc.comment.listByPost.useQuery({ postId });

  return (
    <section className="mt-8">
      <Separator className="mb-6" />

      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-lg font-semibold">
          댓글 {comments ? comments.length : ""}
        </h2>
      </div>

      {/* 댓글 작성 폼 */}
      <div className="mb-6">
        <CommentForm postId={postId} />
      </div>

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment as any} postId={postId} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">첫 댓글을 남겨보세요!</p>
      )}
    </section>
  );
}
