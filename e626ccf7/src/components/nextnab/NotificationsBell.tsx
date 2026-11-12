import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, PackageOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const markRead = useMarkNotificationsRead();

  if (!user) return null;

  const markAllRead = () => {
    const unread = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length > 0) markRead.mutate(unread);
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-error text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display font-bold">Notifications</p>
          {unreadCount > 0 && (
            <button
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              onClick={markAllRead}
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <PackageOpen className="size-8 text-muted-foreground/50" />
              You&apos;re all caught up.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "border-b border-border/60 px-4 py-3 last:border-0",
                  !n.read_at && "bg-accent/50",
                )}
              >
                {n.link ? (
                  <Link to={n.link} className="block">
                    <NotificationBody title={n.title} body={n.body} date={n.created_at} />
                  </Link>
                ) : (
                  <NotificationBody title={n.title} body={n.body} date={n.created_at} />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBody({
  title,
  body,
  date,
}: {
  title: string;
  body: string | null;
  date: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold leading-snug">{title}</p>
      {body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{body}</p>}
      <p className="mt-1 text-[11px] text-muted-foreground/70">{formatDate(date)}</p>
    </div>
  );
}
