import { useEffect, useId, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Invalidates the given query keys whenever one of the tables changes in
 * Supabase realtime, so tracking pages update without waiting for polling.
 */
export function useRealtimeInvalidation(
  channelName: string,
  tables: string[],
  queryKeys: string[],
) {
  const queryClient = useQueryClient();
  // Supabase reuses a channel by name; a per-instance suffix lets several
  // components watch the same tables without colliding on one shared channel.
  const instanceId = useId();
  const latest = useRef({ tables, queryKeys });
  latest.current = { tables, queryKeys };

  useEffect(() => {
    const channel = supabase.channel(`nextnab:${channelName}:${instanceId}`);
    for (const table of latest.current.tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const key of latest.current.queryKeys) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, queryClient, instanceId]);
}
