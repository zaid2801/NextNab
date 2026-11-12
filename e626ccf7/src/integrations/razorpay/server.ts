import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const RAZORPAY_API = "https://api.razorpay.com/v1";

function serverSupabase() {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are not configured");
  }
  return createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Creates a Razorpay order server-side and returns its id plus the public key id. */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator(z.object({ amountInr: z.number().positive(), receipt: z.string() }))
  .handler(async ({ data }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("RAZORPAY_NOT_CONFIGURED");

    const response = await fetch(`${RAZORPAY_API}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(data.amountInr * 100),
        currency: "INR",
        receipt: data.receipt,
      }),
    });
    if (!response.ok) throw new Error("Could not create the Razorpay order");
    const json = (await response.json()) as { id: string };
    return { razorpayOrderId: json.id, keyId };
  });

/**
 * Verifies the Razorpay checkout signature server-side. Pure check — no DB
 * writes, since the order row is created only after payment is confirmed.
 */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("RAZORPAY_NOT_CONFIGURED");

    const expected = await hmacSha256Hex(
      keySecret,
      `${data.razorpayOrderId}|${data.razorpayPaymentId}`,
    );
    if (expected !== data.razorpaySignature) {
      throw new Error("Payment signature verification failed");
    }
    return { verified: true, paymentId: data.razorpayPaymentId };
  });

/** Stamps the real Razorpay payment reference onto an order's payment row. */
export const attachPaymentReference = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string(), paymentId: z.string() }))
  .handler(async ({ data }) => {
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      throw new Error("Supabase server credentials are not configured");
    }
    const supabase = serverSupabase();
    const { error } = await supabase
      .from("payments")
      .update({ reference: data.paymentId, is_test: false })
      .eq("order_id", data.orderId)
      .neq("method", "cod");
    if (error) throw error;
    return { attached: true };
  });
