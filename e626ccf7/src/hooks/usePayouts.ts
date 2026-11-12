import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Payout } from "@/types";

export function usePayouts(partnerId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["payouts", partnerId, userId],
    enabled: !!partnerId && !!userId,
    queryFn: async (): Promise<Payout[]> => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .eq("partner_id", partnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Payout[];
    },
  });
}

export function useAdminPayouts() {
  const { hasRole } = useAuth();

  return useQuery({
    queryKey: ["admin-payouts"],
    enabled: hasRole("admin"),
    queryFn: async (): Promise<Payout[]> => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Payout[];
    },
  });
}
