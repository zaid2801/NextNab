import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useRealtimeInvalidation } from "./useRealtime";
import type { Notification } from "@/types";

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  useRealtimeInvalidation("notifications", ["notifications"], ["notifications"]);

  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const unreadCount = (query.data ?? []).filter((n) => !n.read_at).length;
  return { notifications: query.data ?? [], unreadCount, isLoading: query.isLoading };
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!userId || ids.length === 0) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}
