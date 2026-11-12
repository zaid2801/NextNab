import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Home, MapPin, Navigation, Zap } from "lucide-react";
import type { OrderWithItems } from "@/types";
import { ORDER_LABELS } from "@/hooks/useOrders";
import { inr } from "@/lib/format";
import { buttonBase, buttonSizes, buttonVariants, card } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const STEPS = ["placed", "merchant_confirmed", "partner_assigned", "out_for_delivery"] as const;

export function OrderSuccess({ order }: { order: OrderWithItems }) {
  const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-green-500/10">
        <CheckCircle2 className="size-11 text-green-500" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Payment Successful!
      </h1>
      <p className="mt-2 text-muted-foreground">
        Order <span className="font-semibold text-foreground">#{order.order_number}</span> is
        confirmed
      </p>

      <div
        className={cn(
          card,
          "mt-8 flex flex-wrap items-center justify-between gap-4 bg-accent/40 p-5 text-left",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </span>
          <div>
            <p className="font-display font-bold">Estimated Delivery</p>
            <p className="text-sm text-muted-foreground">High Velocity · electric moped</p>
          </div>
        </div>
        <p className="font-display text-2xl font-extrabold text-primary">
          Arriving in {order.eta_minutes} minutes
        </p>
      </div>

      <div className="mt-6 grid gap-6 text-left sm:grid-cols-2">
        <div className={cn(card, "p-5")}>
          <p className="mb-4 flex items-center gap-2 font-display font-bold">
            <Navigation className="size-4 text-primary" /> Track Your Order
          </p>
          <ol className="space-y-4">
            {STEPS.map((status, index) => (
              <li key={status} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                    index === 0
                      ? "bg-green-500 text-white"
                      : "border border-border text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <div>
                  <p className={cn("text-sm font-semibold", index > 0 && "text-muted-foreground")}>
                    {ORDER_LABELS[status]}
                  </p>
                  {index === 0 && (
                    <p className="flex items-center gap-1 text-xs text-green-600">
                      <Clock className="size-3" /> Just now
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={cn(card, "p-5")}>
          <p className="mb-4 font-display font-bold">Order Summary</p>
          <ul className="space-y-2">
            {order.order_items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate">
                  {item.product_name}
                  <span className="ml-1 text-xs text-muted-foreground">×{item.quantity}</span>
                </span>
                <span className="font-semibold">{inr(item.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={inr(order.subtotal)} />
            <Row
              label="Delivery"
              value={Number(order.delivery_fee) === 0 ? "FREE" : inr(order.delivery_fee)}
            />
            <Row label="Taxes" value={inr(order.taxes)} />
            <div className="flex items-center justify-between pt-1 font-display font-bold">
              <span>Total</span>
              <span>{inr(order.total)}</span>
            </div>
          </div>
          {order.delivery_address && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" /> {order.delivery_address}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/orders/$id"
          params={{ id: order.id }}
          className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg)}
        >
          Track Live Location
        </Link>
        <Link
          to="/"
          className={cn(buttonBase, buttonVariants.outline, buttonSizes.lg)}
        >
          <Home className="size-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
