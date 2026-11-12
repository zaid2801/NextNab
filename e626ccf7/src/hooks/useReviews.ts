import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Review } from "@/types";

export function useOrderReview(orderId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["order-review", orderId, userId],
    enabled: !!orderId && !!userId,
    queryFn: async (): Promise<Review | null> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("order_id", orderId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type ReviewInput = {
  orderId: string;
  storeId?: string | null;
  providerId?: string | null;
  rating: number;
  comment?: string | null;
};

export function useCreateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      if (!user) throw new Error("Sign in to leave a review");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const authorName =
        profile?.full_name?.trim() || user.email?.split("@")[0] || "NextNab customer";
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        author_name: authorName,
        order_id: input.orderId,
        store_id: input.storeId ?? null,
        provider_id: input.providerId ?? null,
        rating: input.rating,
        comment: input.comment?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order-review", variables.orderId] });
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["provider"] });
      void queryClient.invalidateQueries({ queryKey: ["store"] });
      toast.success("Thanks for your review!");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
