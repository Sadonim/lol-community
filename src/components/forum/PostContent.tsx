"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagBadge } from "./TagBadge";
import { VoteButtons } from "./VoteButtons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface PostContentProps {
  post: {
    id: string;
    title: string;
    content: string;
    viewCount: number;
    createdAt: Date;
    voteSum: number;
    author: { id: string; username: string; avatarUrl?: string | null };
    board: { slug: string; name: string };
    tags: { tag: { name: string } }[];
    _count: { comments: number };
  };
}

export function PostContent({ post }: PostContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isAuthor = session?.user?.id === post.author.id;

  const deleteMutation = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("게시글이 삭제되었습니다.");
      router.push(`/boards/${post.board.slug}`);
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <article>
      {/* 제목 */}
      <h1 className="text-2xl font-bold mb-3">{post.title}</h1>

      {/* 메타 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.author.avatarUrl ?? ""} />
            <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{post.author.username}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}</span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-3.5 w-3.5" /> {post.viewCount.toLocaleString()}
          </span>
        </div>

        {isAuthor && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/boards/${post.board.slug}/${post.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* 태그 */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(({ tag }) => (
            <TagBadge key={tag.name} name={tag.name} />
          ))}
        </div>
      )}

      <Separator className="mb-6" />

      {/* 본문 */}
      <div className="prose prose-sm max-w-none whitespace-pre-wrap min-h-[200px] mb-6">
        {post.content}
      </div>

      <Separator className="mb-4" />

      {/* 투표 */}
      <div className="flex justify-center py-2">
        <VoteButtons targetType="post" targetId={post.id} initialSum={post.voteSum} />
      </div>

      {/* 삭제 확인 Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>이 게시글을 삭제하시겠습니까? 삭제 후 복구가 불가능합니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ postId: post.id })}
              disabled={deleteMutation.isPending}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
