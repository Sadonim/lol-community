import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { MessageSquare, Eye, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Post {
  id: string;
  title: string;
  createdAt: Date;
  viewCount: number;
  board: { name: string; slug: string };
  _count: { comments: number; votes: number };
}

interface Props {
  posts: Post[];
}

export function UserPostList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 작성 글</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            작성한 글이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">최근 작성 글</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {posts.map((post) => (
            <li key={post.id} className="px-6 py-3 hover:bg-muted/30 transition-colors">
              <Link href={`/boards/${post.board.slug}/${post.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{post.board.name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {post.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {post._count.votes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {post._count.comments}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
