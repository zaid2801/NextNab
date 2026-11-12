import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useRealtimeInvalidation } from "./useRealtime";
import type { OrderStatus, OrderWithItems, PaymentMethod, PlacedOrder } from "@/types";

export const ORDER_FLOW: OrderStatus[] = [
  "placed",
  "merchant_confirmed",
  "partner_assigned",
  "out_for_delivery",
  "delivered",
];

export const ORDER_LABELS: Record<OrderStatus, string> = {
  placed: "Order placed",
  merchant_confirmed: "Merchant confirmed",
  partner_assigned: "Delivery partner assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function useOrders() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  useRealtimeInvalidation("orders-list", ["orders", "delivery_assignments"], ["orders"]);

  return useQuery({
    queryKey: ["orders", userId],
    enabled: !!userId,
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .order("placed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderWithItems[];
    },
  });
}

export function useOrder(id: string) {
  useRealtimeInvalidation(`order-${id}`, ["orders", "delivery_assignments"], ["order", "orders"]);

  return useQuery({
    queryKey: ["order", id],
    queryFn: async (): Promise<OrderWithItems | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as OrderWithItems | null) ?? null;
    },
    refetchInterval: 30000,
  });
}

export type OrderItemInput = {
  product_id: string;
  quantity: number;
};

export type PlaceOrderInput = {
  items: OrderItemInput[];
  addressId: string;
  deliveryAddress: string;
  method: PaymentMethod;
  upiId?: string | undefined;
  codFee?: number | undefined;
  deliveryLat?: number | undefined;
  deliveryLng?: number | undefined;
};

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PlaceOrderInput): Promise<PlacedOrder[]> => {
      const { data, error } = await supabase.rpc("place_order", {
        _address_id: input.addressId,
        _delivery_address: input.deliveryAddress,
        _method: input.method,
        _upi_id: input.upiId ?? null,
        _cod_fee: input.codFee ?? 0,
        _items: input.items,
        _delivery_lat: input.deliveryLat ?? null,
        _delivery_lng: input.deliveryLng ?? null,
      });
      if (error) throw error;
      return (data ?? []) as PlacedOrder[];
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc("cancel_order", {
        p_order_id: orderId,
      });
      if (error) throw error;
    },
    onSuccess: (_data, orderId) => {
      void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
      toast.success("Order cancelled");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
