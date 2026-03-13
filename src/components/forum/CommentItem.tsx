"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoteButtons } from "./VoteButtons";
import { CommentForm } from "./CommentForm";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  voteSum: number;
  author: { id: string; username: string; avatarUrl?: string | null };
  replies?: Omit<Comment, "replies">[];
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
}

export function CommentItem({ comment, postId, isReply = false }: CommentItemProps) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const utils = trpc.useUtils();

  const isAuthor = session?.user?.id === comment.author.id;

  const deleteMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      utils.comment.listByPost.invalidate({ postId });
      toast.success("댓글이 삭제되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className={isReply ? "ml-8 mt-2" : ""}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.avatarUrl ?? ""} />
          <AvatarFallback>{comment.author.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{comment.author.username}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
            </span>
          </div>

          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center gap-1 mt-2">
            <VoteButtons
              targetType="comment"
              targetId={comment.id}
              initialSum={comment.voteSum}
            />

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setShowReplyForm((v) => !v)}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                답글
              </Button>
            )}

            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => deleteMutation.mutate({ commentId: comment.id })}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>

          {/* 답글 폼 */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                placeholder="답글을 입력하세요"
                onSuccess={() => setShowReplyForm(false)}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-muted ml-4 pl-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} isReply />
          ))}
        </div>
      )}
    </div>
  );
}
