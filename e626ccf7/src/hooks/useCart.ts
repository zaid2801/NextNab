import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CartLine } from "@/types";
import { summarise } from "@/lib/cart-math";

async function ensureCart(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id;
  const created = await supabase.from("carts").insert({ user_id: userId }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id;
}

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async (): Promise<CartLine[]> => {
      const cartId = await ensureCart(userId!);
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, product:products(*)")
        .eq("cart_id", cartId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CartLine[];
    },
  });

  const lines = query.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart", userId] });

  const addItem = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!userId) throw new Error("Pehle login karo, phir items cart me add karo");
      const cartId = await ensureCart(userId);
      const existing = lines.find((line) => line.product_id === productId);
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("cart_items")
        .insert({ cart_id: cartId, product_id: productId, quantity });
      if (error) throw error;
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Added to cart");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Item removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const cartId = await ensureCart(userId!);
      const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
  });

  return {
    lines,
    isLoading: query.isLoading,
    bill: summarise(lines),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  };
}
