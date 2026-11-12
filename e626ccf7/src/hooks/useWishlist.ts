import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { WishlistEntry } from "@/types";

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["wishlist", userId],
    enabled: !!userId,
    queryFn: async (): Promise<WishlistEntry[]> => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*, product:products(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WishlistEntry[];
    },
  });

  const entries = query.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wishlist", userId] });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error("Sign in to save items to your wishlist");
      const existing = entries.find((entry) => entry.product_id === productId);
      if (existing) {
        const { error } = await supabase.from("wishlists").delete().eq("id", existing.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("wishlists")
        .insert({ user_id: userId, product_id: productId });
      if (error) throw error;
      return true;
    },
    onSuccess: (added) => {
      void invalidate();
      toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    entries,
    productIds: new Set(entries.map((entry) => entry.product_id)),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    toggle,
  };
}
