import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";

const API_VERSION = "2";
const SECRET_VERSION = "2022-09-01";
const TERMINAL_FAILURES = new Set(["FAILED", "TERMINATED", "EXPIRED"]);

export type CashfreeMode = "sandbox" | "production";

type CashfreeConfig = {
  appId: string;
  secretKey: string;
  base: string;
  mode: CashfreeMode;
};

function cashfreeConfig(): CashfreeConfig {
  const appId = process.env["CASHFREE_APP_ID"];
  const secretKey = process.env["CASHFREE_SECRET_KEY"];
  if (!appId || !secretKey) throw new Error("CASHFREE_NOT_CONFIGURED");

  const mode: CashfreeMode =
    process.env["CASHFREE_ENV"] === "production" ? "production" : "sandbox";
  return {
    appId,
    secretKey,
    mode,
    base: mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
  };
}

function authHeaders(config: CashfreeConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": config.appId,
    "x-client-secret": config.secretKey,
    "x-client-secret-version": SECRET_VERSION,
  };
}

type CashfreePayment = {
  cf_payment_id: number;
  payment_status: string;
  order_amount: number;
  payment_message?: string;
};

/**
 * Creates a Cashfree PG order server-side. The return URL is derived from the
 * incoming request origin so a caller cannot redirect the shopper elsewhere.
 */
export const createCashfreeOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      amountInr: z.number().positive(),
      customerId: z.string().min(1),
      customerEmail: z.string().email(),
      customerPhone: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const config = cashfreeConfig();
    const origin = getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin;
    const phone = data.customerPhone.replace(/\D/g, "").slice(-10);
    if (phone.length !== 10) throw new Error("A valid 10-digit mobile number is required");

    const orderId = `nn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const response = await fetch(`${config.base}/orders`, {
      method: "POST",
      headers: authHeaders(config),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Math.round(data.amountInr * 100) / 100,
        order_currency: "INR",
        customer_details: {
          customer_id: data.customerId,
          customer_email: data.customerEmail,
          customer_phone: phone,
        },
        order_meta: {
          return_url: `${origin}/payment/return?cf_order_id={order_id}`,
        },
        order_note: "NextNab order",
      }),
    });

    if (!response.ok) throw new Error("Could not create the Cashfree order");
    const json = (await response.json()) as { payment_session_id?: string };
    if (!json.payment_session_id) throw new Error("Cashfree did not return a payment session");

    return {
      cashfreeOrderId: orderId,
      paymentSessionId: json.payment_session_id,
      mode: config.mode,
    };
  });

/**
 * Confirms a payment by reading Cashfree's own order state — never by trusting
 * anything the browser posts back. Polls briefly because the redirect can beat
 * Cashfree's status propagation.
 */
export const verifyCashfreeOrder = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const config = cashfreeConfig();

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(
        `${config.base}/orders/${encodeURIComponent(data.orderId)}/payments`,
        { headers: authHeaders(config) },
      );
      if (!response.ok) throw new Error("Could not verify the Cashfree payment");

      const payments = (await response.json()) as CashfreePayment[];
      const success = payments.find((payment) => payment.payment_status === "SUCCESS");
      if (success) {
        return {
          verified: true,
          cfPaymentId: String(success.cf_payment_id),
          amount: success.order_amount,
        };
      }
      if (payments.some((payment) => TERMINAL_FAILURES.has(payment.payment_status))) {
        throw new Error("Payment failed");
      }

      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    throw new Error("PAYMENT_PENDING");
  });
