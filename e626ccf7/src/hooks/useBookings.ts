import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useRealtimeInvalidation } from "./useRealtime";
import type { PaymentMethod, ServiceBooking, ServiceProvider } from "@/types";
import { newBookingNumber } from "@/lib/format";

export type BookingWithProvider = ServiceBooking & { provider: ServiceProvider | null };

export function useBookings() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  useRealtimeInvalidation("bookings-list", ["service_bookings"], ["bookings"]);

  return useQuery({
    queryKey: ["bookings", userId],
    enabled: !!userId,
    queryFn: async (): Promise<BookingWithProvider[]> => {
      const { data, error } = await supabase
        .from("service_bookings")
        .select("*, provider:service_providers(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingWithProvider[];
    },
  });
}

export type BookingInput = {
  providerId: string;
  serviceId?: string | null;
  serviceName: string;
  addressId?: string | null;
  serviceAddress: string;
  scheduledDate: string;
  timeSlot: string;
  visitingFee: number;
  amount: number;
  method: PaymentMethod;
};

export function useCreateBooking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BookingInput) => {
      const { data, error } = await supabase
        .from("service_bookings")
        .insert({
          booking_number: newBookingNumber(),
          user_id: user!.id,
          provider_id: input.providerId,
          service_id: input.serviceId ?? null,
          service_name: input.serviceName,
          address_id: input.addressId ?? null,
          service_address: input.serviceAddress,
          scheduled_date: input.scheduledDate,
          time_slot: input.timeSlot,
          visiting_fee: input.visitingFee,
          amount: input.amount,
          payment_method: input.method,
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking requested successfully!");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase.rpc("cancel_booking", {
        p_booking_id: bookingId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking cancelled");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
