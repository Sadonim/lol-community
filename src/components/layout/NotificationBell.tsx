"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: unreadData } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30_000, // 30초마다 갱신
  });

  const { data: notifications, refetch } = trpc.notification.list.useQuery(
    { limit: 20 },
    { enabled: open }
  );

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => refetch(),
  });

  const unreadCount = unreadData?.count ?? 0;

  const handleNotificationClick = (id: string, linkUrl: string | null, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate({ id });
    }
    setOpen(false);
    if (linkUrl) router.push(linkUrl);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">알림</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={() => markAllRead.mutate()}
            >
              모두 읽음
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {!notifications || notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            알림이 없습니다
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer ${
                !notification.isRead ? "bg-muted/50" : ""
              }`}
              onClick={() =>
                handleNotificationClick(notification.id, notification.linkUrl, notification.isRead)
              }
            >
              <div className="flex w-full items-center gap-2">
                {!notification.isRead && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <span className={`text-sm ${!notification.isRead ? "font-medium" : "text-muted-foreground"}`}>
                  {notification.title}
                </span>
                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              {notification.body && (
                <p className="pl-3.5 text-xs text-muted-foreground line-clamp-2">
                  {notification.body}
                </p>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
