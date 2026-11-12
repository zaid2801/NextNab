import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { PartnerApplication, PartnerType } from "@/types";

export const KYC_BUCKET = "kyc-documents";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** Uploads a KYC file to the private bucket and returns its storage path (never a public URL). */
export async function uploadKycFile(userId: string, slot: string, file: File): Promise<string> {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, WEBP or PDF file.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large — please keep documents under 5 MB.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${slot}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(KYC_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export function usePartnerApplications() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["partner-applications", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PartnerApplication[]> => {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type PartnerApplicationInput = {
  partner_type: PartnerType;
  full_name: string;
  phone: string;
  city?: string;
  business_name?: string | null;
  business_category?: string | null;
  business_address?: string | null;
  gstin?: string | null;
  service_category?: string | null;
  experience?: string | null;
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  license_number?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
  business_proof_url?: string | null;
  certificate_url?: string | null;
};

export function useSubmitPartnerApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PartnerApplicationInput) => {
      const { data, error } = await supabase
        .from("partner_applications")
        .insert({
          ...input,
          city: input.city ?? "Latur",
          user_id: user!.id,
          status: "submitted",
          current_step: 3,
          submitted_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["partner-applications"] });
      toast.success("Application submitted — we'll review it shortly");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
