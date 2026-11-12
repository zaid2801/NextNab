import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Address } from "@/types";

export type AddressInput = {
  label: string;
  contact_name: string;
  contact_phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
};

export function useAddresses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["addresses", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Address[]> => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addAddress = useMutation({
    mutationFn: async (input: AddressInput) => {
      const { data, error } = await supabase
        .from("addresses")
        .insert({ ...input, user_id: userId! })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Address saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const clear = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId!);
      if (clear.error) throw clear.error;
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Default address updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Address removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    addresses: query.data ?? [],
    isLoading: query.isLoading,
    addAddress,
    setDefault,
    removeAddress,
  };
}
