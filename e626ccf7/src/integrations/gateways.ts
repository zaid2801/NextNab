import { createServerFn } from "@tanstack/react-start";

export type GatewayId = "razorpay" | "cashfree";

/** Reports which gateways the server can actually use. Keys never leave the server. */
export const getGatewayConfig = createServerFn({ method: "GET" }).handler(async () => ({
  razorpay: Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]),
  cashfree: Boolean(process.env["CASHFREE_APP_ID"] && process.env["CASHFREE_SECRET_KEY"]),
}));
