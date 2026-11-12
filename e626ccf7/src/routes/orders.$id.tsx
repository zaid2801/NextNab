import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bike,
  Check,
  CircleDot,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { LiveOrderMap } from "@/components/nextnab/LiveOrderMap";
import { OrderSuccess } from "@/components/nextnab/OrderSuccess";
import { ErrorState, LoadingState } from "@/components/nextnab/States";
import { ORDER_FLOW, ORDER_LABELS, useCancelOrder, useOrder } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useCreateReview, useOrderReview } from "@/hooks/useReviews";
import { useRiderLocation } from "@/hooks/useRiderTracking";
import { container } from "@/lib/design-system";
import { formatDate, inr } from "@/lib/format";
import { orderPin } from "@/lib/geo";
import { cn } from "@/lib/utils";

const title = "Order Tracking — NextNab";
const description =
  "Live tracking for your NextNab order — from merchant confirmation to doorstep.";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { placed?: boolean } => ({
    placed: search["placed"] === "1" || search["placed"] === 1 || search["placed"] === true,
  }),
  component: OrderDetailPage,
});

function useOrderRider(orderId: string) {
  return useQuery({
    queryKey: ["order-rider", orderId],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("delivery_assignments")
        .select("rider:riders(full_name)")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) return null;
      return (data?.rider as { full_name: string } | null)?.full_name ?? null;
    },
  });
}

function useStoreLocation(storeId: string | null) {
  return useQuery({
    queryKey: ["store-location", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<{ lat: number; lng: number } | null> => {
      const { data, error } = await supabase
        .from("stores")
        .select("latitude,longitude")
        .eq("id", storeId!)
        .maybeSingle();
      if (error || !data?.latitude || !data?.longitude) return null;
      return { lat: data.latitude, lng: data.longitude };
    },
  });
}

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { placed } = Route.useSearch();
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const { data: riderName } = useOrderRider(id);
  const outForDelivery = order?.status === "out_for_delivery";
  const { data: storeLocation } = useStoreLocation(order?.store_id ?? null);
  const riderPoint = useRiderLocation(id, outForDelivery);
  const cancelOrder = useCancelOrder();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState label="Loading your order…" className="py-24" />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <ErrorState
          title="Couldn't load this order"
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell>
        <div className={`${container} py-24 text-center`}>
          <h1 className="font-display text-2xl font-extrabold">Order not found</h1>
          <Link to="/orders" className="mt-6 inline-block">
            <Button>Back to orders</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const activeIndex = ORDER_FLOW.indexOf(order.status);
  const payment = order.payments[0];
  const cancellable =
    !cancelled && (order.status === "placed" || order.status === "merchant_confirmed");

  if (placed && !cancelled && !delivered) {
    return (
      <PageShell>
        <OrderSuccess order={order} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={`${container} py-12`}>
        <div className="text-center">
          <span
            className={cn(
              "mx-auto grid size-20 place-items-center rounded-full shadow-card",
              cancelled ? "bg-destructive/15 text-destructive" : "bg-[#6ffbbe] text-[#00432b]",
            )}
          >
            {cancelled ? (
              <X className="size-9" aria-hidden="true" />
            ) : (
              <Check className="size-9" aria-hidden="true" />
            )}
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {cancelled ? "Order Cancelled" : delivered ? "Order Delivered!" : "Payment Successful!"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order #{order.order_number} {cancelled ? "cancelled" : "confirmed"} · Placed{" "}
            {formatDate(order.placed_at)}
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl items-center justify-between gap-4 rounded-2xl bg-accent/70 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {delivered ? "Delivered" : "Estimated Delivery"}
            </p>
            <p className="mt-1 font-display text-base font-extrabold">
              {delivered
                ? "Arrived at your doorstep"
                : cancelled
                  ? "—"
                  : `Arriving in ${order.eta_minutes} minutes`}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold text-primary shadow-soft">
            <Bike className="size-4" aria-hidden="true" /> High Velocity
          </span>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[1fr_380px]">
          <section
            id="track"
            className="scroll-mt-24 rounded-3xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <h2 className="font-display text-lg font-extrabold">Track Your Order</h2>
            <ol className="mt-6 space-y-6">
              {ORDER_FLOW.map((step, index) => {
                const done = !cancelled && index <= activeIndex;
                const current = !cancelled && index === activeIndex;
                const last = index === ORDER_FLOW.length - 1;
                return (
                  <li key={step} className="relative flex gap-4">
                    {!last && (
                      <span
                        className={cn(
                          "absolute left-[13px] top-8 h-[calc(100%-8px)] w-0.5",
                          done && index < activeIndex ? "bg-primary" : "bg-border",
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 grid size-7 shrink-0 place-items-center rounded-full",
                        done
                          ? "bg-primary text-primary-foreground"
                          : current
                            ? "border-2 border-primary text-primary"
                            : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : current ? (
                        <CircleDot className="size-4" aria-hidden="true" />
                      ) : (
                        <span className="size-2 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="pb-1">
                      <p
                        className={cn(
                          "font-display text-sm font-bold",
                          current && "text-primary",
                          !done && !current && "text-muted-foreground",
                        )}
                      >
                        {ORDER_LABELS[step]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {current && step === "partner_assigned" && riderName
                          ? `${riderName} is heading to the store`
                          : done
                            ? "Completed"
                            : "Pending"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {outForDelivery ? (
              <div className="mt-6">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
                  <span className="relative flex size-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  Live — {riderName ?? "your rider"} is on the way
                </p>
                <LiveOrderMap
                  rider={riderPoint}
                  origin={storeLocation ?? null}
                  destination={orderPin(order)}
                  className="h-80"
                />
                {!riderPoint && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Waiting for the rider&apos;s GPS signal…
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-6">
                <LiveOrderMap
                  rider={null}
                  origin={storeLocation ?? null}
                  destination={orderPin(order)}
                  className="h-56"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {orderPin(order)
                    ? "Store to your delivery pin — the rider appears on this map live once the order is out for delivery."
                    : "Store location — the live rider map appears once the order is out for delivery."}
                </p>
              </div>
            )}

            {order.delivery_address && (
              <p className="mt-4 flex gap-2 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {order.delivery_address}
              </p>
            )}
          </section>

          <div className="h-fit rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-extrabold">Order Summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {item.product_name}{" "}
                    <span className="ml-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-foreground">
                      x{item.quantity}
                    </span>
                  </span>
                  <span className="font-semibold">{inr(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
              <Row label="Subtotal" value={inr(order.subtotal)} />
              <Row
                label="Delivery Fee"
                value={Number(order.delivery_fee) === 0 ? "Free" : inr(order.delivery_fee)}
                free={Number(order.delivery_fee) === 0}
              />
              <Row label="Taxes & Charges" value={inr(order.taxes)} />
              {Number(order.cod_fee) > 0 && <Row label="COD handling" value={inr(order.cod_fee)} />}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="font-display font-extrabold">Total</dt>
                <dd className="font-display text-lg font-extrabold text-primary">
                  {inr(order.total)}
                </dd>
              </div>
            </dl>
            {payment && (
              <p className="mt-3 text-xs text-muted-foreground">
                {payment.method.toUpperCase()} ·{" "}
                {payment.status === "success"
                  ? "Paid"
                  : payment.status === "pending"
                    ? "Pending"
                    : payment.status}
                {payment.reference ? ` · ${payment.reference}` : ""}
              </p>
            )}
            <p className="mt-4 flex gap-2 rounded-2xl bg-secondary p-4 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              Invoice has been sent to your registered email and phone number.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={() => document.getElementById("track")?.scrollIntoView({ behavior: "smooth" })}
          >
            <Navigation className="size-4" aria-hidden="true" /> Track Live Location
          </Button>
          <Link to="/" className="sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>

        {cancellable && (
          <div className="mx-auto mt-6 max-w-2xl text-center">
            {!confirmingCancel ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(true)}>
                <XCircle className="size-4" aria-hidden="true" /> Cancel order
              </Button>
            ) : (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-sm font-bold">Cancel this order?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Items will be returned to stock. This can&apos;t be undone.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancelOrder.isPending}
                    onClick={() => setConfirmingCancel(false)}
                  >
                    Keep order
                  </Button>
                  <Button
                    size="sm"
                    className="border border-destructive/50 bg-destructive text-white hover:bg-destructive/90"
                    loading={cancelOrder.isPending}
                    onClick={() => cancelOrder.mutate(order.id)}
                  >
                    Yes, cancel order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {delivered && (
          <div className="mx-auto mt-10 max-w-3xl">
            <OrderReviewCard orderId={order.id} storeId={order.store_id} />
          </div>
        )}
      </div>
    </PageShell>
  );
}

function OrderReviewCard({ orderId, storeId }: { orderId: string; storeId: string | null }) {
  const { user } = useAuth();
  const { data: existing, isLoading } = useOrderReview(orderId);
  const create = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!user) return null;

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading your review…
        </div>
      </section>
    );
  }

  if (existing) {
    return (
      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-extrabold">Your review</h2>
        <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={cn(
                "size-4",
                index < Number(existing.rating) ? "fill-current text-brand" : "text-border",
              )}
              aria-hidden="true"
            />
          ))}
        </p>
        {existing.comment && (
          <p className="mt-2 text-sm text-muted-foreground">{existing.comment}</p>
        )}
      </section>
    );
  }

  function submit() {
    if (rating < 1) return;
    create.mutate({ orderId, storeId, rating, comment });
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
      <h2 className="font-display text-lg font-extrabold">Rate your order</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        How was your delivery? Your feedback helps neighbours in Latur.
      </p>

      <div className="mt-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
            className="rounded-full p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn("size-7", value <= rating ? "fill-current text-brand" : "text-border")}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        placeholder="Tell us more (optional)"
        className="mt-4 w-full rounded-2xl border border-border bg-surface-low px-4 py-3 text-sm outline-none focus:border-brand"
      />

      <Button className="mt-4" disabled={rating < 1} loading={create.isPending} onClick={submit}>
        Submit review
      </Button>
    </section>
  );
}

function Row({ label, value, free }: { label: string; value: string; free?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold", free && "font-bold text-[#006c49]")}>{value}</dd>
    </div>
  );
}
