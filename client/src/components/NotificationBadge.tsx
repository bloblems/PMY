import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export function NotificationBadge() {
  const { user } = useAuth();

  // Fetch unread notification count only when user is authenticated
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread/count"],
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const unreadCount = data?.count || 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      data-testid="button-notifications"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs font-semibold"
          data-testid="badge-unread-count"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
