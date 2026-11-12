import type { PaymentMethod } from "@/types";

export type PendingCheckout = {
  gatewayOrderId: string;
  amount: number;
  addressId: string;
  deliveryAddress: string;
  method: PaymentMethod;
  upiId?: string | undefined;
  codFee: number;
  items: { product_id: string; quantity: number }[];
  deliveryLat?: number | undefined;
  deliveryLng?: number | undefined;
};

const KEY = "nextnab:pending-checkout";

/** Survives the redirect to an off-site payment page, which unmounts the app. */
export function stashPendingCheckout(value: PendingCheckout) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function takePendingCheckout(): PendingCheckout | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  localStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as PendingCheckout;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  localStorage.removeItem(KEY);
}
