import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type {
  Order,
  OrderStatus,
  PartnerApplication,
  PartnerType,
  Payment,
  PaymentStatus,
  Product,
  Profile,
  Review,
  Rider,
  ServiceProvider,
  Store,
} from "@/types";

export type ApplicationDecision = "under_review" | "approved" | "rejected";

/** All partner applications — RLS only returns every row for admins. */
export function useAllApplications() {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  return useQuery({
    queryKey: ["admin-applications", user?.id ?? null],
    enabled: !!user && isAdmin,
    queryFn: async (): Promise<PartnerApplication[]> => {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type PlatformStats = {
  customers: number;
  stores: number;
  providers: number;
  riders: number;
  orders: number;
  bookings: number;
  pending: number;
};

export function usePlatformStats() {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  return useQuery({
    queryKey: ["admin-stats", user?.id ?? null],
    enabled: !!user && isAdmin,
    queryFn: async (): Promise<PlatformStats> => {
      const count = async (
        table:
          "profiles" | "stores" | "service_providers" | "riders" | "orders" | "service_bookings",
      ) => {
        const { count: rows, error } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true });
        if (error) throw error;
        return rows ?? 0;
      };

      const [customers, stores, providers, riders, orders, bookings] = await Promise.all([
        count("profiles"),
        count("stores"),
        count("service_providers"),
        count("riders"),
        count("orders"),
        count("service_bookings"),
      ]);

      const { count: pending, error: pendingError } = await supabase
        .from("partner_applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review"]);
      if (pendingError) throw pendingError;

      return {
        customers,
        stores,
        providers,
        riders,
        orders,
        bookings,
        pending: pending ?? 0,
      };
    },
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: ApplicationDecision;
      note?: string;
    }) => {
      const trimmed = note?.trim();
      const { error } = await supabase.rpc("review_partner_application", {
        _app_id: id,
        _decision: decision,
        ...(trimmed ? { _note: trimmed } : {}),
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["partner-applications"] });
      toast.success(
        variables.decision === "approved"
          ? "Partner approved — their dashboard is now open"
          : variables.decision === "rejected"
            ? "Application rejected"
            : "Marked as under review",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

function useAdminQuery<T>(key: string, fn: () => Promise<T[]>) {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  return useQuery({
    queryKey: [key, user?.id ?? null],
    enabled: !!user && isAdmin,
    queryFn: fn,
  });
}

export function useAdminUsers() {
  return useAdminQuery<Profile>("admin-users", async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminStores() {
  return useAdminQuery<Store>("admin-stores", async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminProducts() {
  return useAdminQuery<Product>("admin-products", async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminOrders() {
  return useAdminQuery<Order>("admin-orders", async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("placed_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminPayments() {
  return useAdminQuery<Payment>("admin-payments", async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminProviders() {
  return useAdminQuery<ServiceProvider>("admin-providers", async () => {
    const { data, error } = await supabase
      .from("service_providers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminRiders() {
  return useAdminQuery<Rider>("admin-riders", async () => {
    const { data, error } = await supabase
      .from("riders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminReviews() {
  return useAdminQuery<Review>("admin-reviews", async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
}

export function useAdminSetOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.rpc("admin_set_order_status", {
        p_order_id: id,
        p_status: status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAdminSetPaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reference,
    }: {
      id: string;
      status: PaymentStatus;
      reference?: string;
    }) => {
      const { error } = await supabase.rpc("admin_set_payment_status", {
        p_payment_id: id,
        p_status: status,
        ...(reference?.trim() ? { p_reference: reference.trim() } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success("Payment updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export type PartnerFlagTarget = {
  table: "stores" | "service_providers" | "riders";
  flag: "is_live" | "is_verified" | "is_online";
};

export function useAdminSetPartnerFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      target,
      id,
      value,
    }: {
      target: PartnerFlagTarget;
      id: string;
      value: boolean;
    }) => {
      const { error } = await supabase.rpc("admin_set_partner_flag", {
        p_table: target.table,
        p_id: id,
        p_flag: target.flag,
        p_value: value,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      toast.success("Updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export type CreatePayoutInput = {
  partnerType: PartnerType;
  partnerId: string;
  userId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  note?: string;
};

export function useCreatePayout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePayoutInput) => {
      const { error } = await supabase.from("payouts").insert({
        partner_type: input.partnerType,
        partner_id: input.partnerId,
        user_id: input.userId,
        amount: input.amount,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        status: "paid",
        paid_at: new Date().toISOString(),
        note: input.note?.trim() || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      void queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast.success("Payout recorded");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
