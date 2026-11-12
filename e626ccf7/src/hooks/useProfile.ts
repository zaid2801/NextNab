import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Profile } from "@/types";

export type ProfileInput = { full_name: string; phone: string };

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const save = useMutation({
    mutationFn: async (input: ProfileInput) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: input.full_name.trim(), phone: input.phone.trim() })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { profile: query.data ?? null, isLoading: query.isLoading, save };
}
