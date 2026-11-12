import type { CartLine } from "@/types";

export const FREE_DELIVERY_THRESHOLD = 199;
export const DELIVERY_FEE = 40;
export const TAX_RATE = 0.05;
export const COD_HANDLING_FEE = 20;

export type BillSummary = {
  subtotal: number;
  savings: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  freeDelivery: boolean;
  itemCount: number;
};

export function summarise(lines: CartLine[], codFee = 0): BillSummary {
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.product?.price ?? 0) * line.quantity,
    0,
  );
  const savings = lines.reduce(
    (sum, line) =>
      sum + Math.max(0, Number(line.product?.mrp ?? 0) - Number(line.product?.price ?? 0)) * line.quantity,
    0,
  );
  const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0;
  const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
  const taxes = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + deliveryFee + taxes + codFee) * 100) / 100;
  return {
    subtotal,
    savings,
    deliveryFee,
    taxes,
    total,
    freeDelivery,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
