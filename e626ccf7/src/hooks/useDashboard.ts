import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type {
  BookingStatus,
  DeliveryAssignment,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Rider,
  Service,
  ServiceBooking,
  ServiceProvider,
  Store,
} from "@/types";

/* ---------------- merchant ---------------- */

export function useMyStore() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["my-store", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Store | null> => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useStoreProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-products", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type StoreOrder = Order & { order_items: OrderItem[] };

export function useStoreOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-orders", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<StoreOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("store_id", storeId!)
        .order("placed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as StoreOrder[];
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const stamps: Record<string, string> = {};
      if (status === "merchant_confirmed") stamps["confirmed_at"] = new Date().toISOString();
      if (status === "out_for_delivery") stamps["out_for_delivery_at"] = new Date().toISOString();
      if (status === "delivered") stamps["delivered_at"] = new Date().toISOString();
      const { error } = await supabase
        .from("orders")
        .update({ status, ...stamps })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["rider-assignments"] });
      toast.success("Order updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAssignRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const { error } = await supabase.rpc("assign_order_rider", { _order_id: orderId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["rider-assignments"] });
      toast.success("Delivery partner assigned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleStoreOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isOnline }: { id: string; isOnline: boolean }) => {
      const { error } = await supabase.from("stores").update({ is_online: isOnline }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["my-store"] });
      toast.success(variables.isOnline ? "Store is now open" : "Store is now closed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleProductLive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isLive }: { id: string; isLive: boolean }) => {
      const { error } = await supabase.from("products").update({ is_live: isLive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
      toast.success("Product updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

function makeSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "product"}-${Date.now().toString(36)}`;
}

export type ProductDraft = {
  store_id: string;
  name: string;
  unit: string;
  mrp: number;
  price: number;
  stock: number;
  category_id?: string | null;
  image_url?: string | null;
  short_description?: string | null;
  description?: string | null;
  is_live?: boolean;
};

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ProductDraft) => {
      const { error } = await supabase.from("products").insert({
        store_id: draft.store_id,
        slug: makeSlug(draft.name),
        name: draft.name,
        unit: draft.unit,
        mrp: draft.mrp,
        price: draft.price,
        stock: draft.stock,
        category_id: draft.category_id ?? null,
        image_url: draft.image_url ?? null,
        short_description: draft.short_description ?? null,
        description: draft.description ?? null,
        is_live: draft.is_live ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export type ProductPatch = Partial<Omit<ProductDraft, "store_id">>;

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProductPatch }) => {
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export type StorePatch = {
  name?: string;
  opening_time?: string | null;
  closing_time?: string | null;
  open_days?: string[];
  address?: string | null;
  city?: string;
  image_url?: string | null;
  min_order_value?: number | null;
  packaging_charge?: number | null;
};

export function useUpdateStoreProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: StorePatch }) => {
      const { error } = await supabase.from("stores").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-store"] });
      void queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Store profile saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${Date.now().toString(36)}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data.publicUrl;
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- service provider ---------------- */

export function useMyProviderProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["my-provider", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ServiceProvider | null> => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useProviderServices(providerId: string | undefined) {
  return useQuery({
    queryKey: ["provider-services", providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", providerId!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProviderBookings(providerId: string | undefined) {
  return useQuery({
    queryKey: ["provider-bookings", providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<ServiceBooking[]> => {
      const { data, error } = await supabase
        .from("service_bookings")
        .select("*")
        .eq("provider_id", providerId!)
        .order("scheduled_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase.from("service_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleProviderOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isOnline }: { id: string; isOnline: boolean }) => {
      const { error } = await supabase
        .from("service_providers")
        .update({ is_online: isOnline })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["my-provider"] });
      toast.success(variables.isOnline ? "You're accepting jobs" : "You're offline");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export type ServiceDraft = {
  provider_id: string;
  name: string;
  price: number;
  category_id?: string | null;
  description?: string | null;
  duration?: string | null;
  is_active?: boolean;
};

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ServiceDraft) => {
      const { error } = await supabase.from("services").insert({
        provider_id: draft.provider_id,
        name: draft.name,
        price: draft.price,
        category_id: draft.category_id ?? null,
        description: draft.description ?? null,
        duration: draft.duration ?? null,
        is_active: draft.is_active ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export type ServicePatch = Partial<Omit<ServiceDraft, "provider_id">>;

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ServicePatch }) => {
      const { error } = await supabase.from("services").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["provider-services"] });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export type ProviderPatch = {
  headline?: string | null;
  bio?: string | null;
  base_visit_fee?: number | null;
  hourly_rate?: number | null;
  service_areas?: string[];
  available_days?: string[];
  avatar_url?: string | null;
  experience_years?: number;
};

export function useUpdateProviderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProviderPatch }) => {
      const { error } = await supabase.from("service_providers").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-provider"] });
      void queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Profile saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- rider ---------------- */

export function useMyRider() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["my-rider", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Rider | null> => {
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type RiderAssignment = DeliveryAssignment & { order: Order | null };

export function useRiderAssignments(riderId: string | undefined) {
  return useQuery({
    queryKey: ["rider-assignments", riderId],
    enabled: !!riderId,
    queryFn: async (): Promise<RiderAssignment[]> => {
      const { data, error } = await supabase
        .from("delivery_assignments")
        .select("*, order:orders(*)")
        .eq("rider_id", riderId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as RiderAssignment[];
    },
  });
}

export type DeliveryAction = "accept" | "pickup" | "out_for_delivery" | "delivered";

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: DeliveryAction }) => {
      const { error } = await supabase.rpc("rider_update_delivery", {
        _assignment_id: id,
        _action: action,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rider-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order"] });
      toast.success("Delivery updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleRiderOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isOnline }: { id: string; isOnline: boolean }) => {
      const { error } = await supabase.from("riders").update({ is_online: isOnline }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["my-rider"] });
      toast.success(variables.isOnline ? "You're online for deliveries" : "You're offline");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
