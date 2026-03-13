import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Eye, MessageSquare, ThumbsUp, Pin } from "lucide-react";
import { TagBadge } from "./TagBadge";

interface PostListItemProps {
  id: string;
  boardSlug: string;
  title: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: Date;
  author: { username: string };
  commentCount: number;
  voteSum: number;
  tags: { tag: { name: string } }[];
}

export function PostListItem({
  id,
  boardSlug,
  title,
  isPinned,
  viewCount,
  createdAt,
  author,
  commentCount,
  voteSum,
  tags,
}: PostListItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b hover:bg-muted/30 transition-colors">
      {isPinned && <Pin className="h-4 w-4 text-primary mt-0.5 shrink-0" />}

      <div className="flex-1 min-w-0">
        <Link
          href={`/boards/${boardSlug}/${id}`}
          className="font-medium hover:text-primary transition-colors line-clamp-1"
        >
          {title}
          {commentCount > 0 && (
            <span className="ml-1.5 text-sm text-primary">[{commentCount}]</span>
          )}
        </Link>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map(({ tag }) => (
              <TagBadge key={tag.name} name={tag.name} clickable />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{author.username}</span>
          <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko })}</span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" /> {viewCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" /> {commentCount}
          </span>
          <span className="flex items-center gap-0.5">
            <ThumbsUp className="h-3 w-3" /> {voteSum}
          </span>
        </div>
      </div>
    </div>
  );
}
