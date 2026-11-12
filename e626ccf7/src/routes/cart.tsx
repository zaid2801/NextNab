import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Headphones,
  Info,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { QuantityStepper } from "@/components/nextnab/QuantityStepper";
import { LoadingState } from "@/components/nextnab/States";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { container } from "@/lib/design-system";
import { inr } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/cart-math";

const title = "Your Cart — NextNab";
const description = "Review your NextNab basket, update quantities and checkout in a few taps.";

export const Route = createFileRoute("/cart")({
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
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { lines, bill, isLoading, setQuantity, removeItem } = useCart();

  if (!user) {
    return (
      <PageShell>
        <div className={`${container} py-24 text-center`}>
          <ShoppingCart className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Sign in to see your cart</h1>
          <Link to="/login" className="mt-6 inline-block">
            <Button size="lg">Login / Sign up</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={`${container} py-10`}>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Your Cart
        </h1>
        <p className="mt-2 text-muted-foreground">Review your items before checkout.</p>

        {isLoading ? (
          <LoadingState label="Loading your cart…" className="py-24" />
        ) : lines.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/groceries" className="mt-6 inline-block">
              <Button>Start shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="flex items-center gap-4 rounded-2xl bg-secondary p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-brand">
                  <Truck className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-lg font-extrabold">20-Min Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    To your doorstep. Track your order in real-time.
                  </p>
                </div>
              </div>

              <ul className="mt-4 divide-y divide-border rounded-2xl border border-border/60 bg-card shadow-soft">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-center gap-4 p-5">
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {line.product?.image_url && (
                        <img
                          src={line.product.image_url}
                          alt={line.product.name}
                          className="size-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-bold">
                        {line.product?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {line.product?.short_description ?? line.product?.unit}
                      </p>
                      <p className="mt-1 font-display text-sm font-extrabold text-primary">
                        {inr(line.product?.price ?? 0)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <QuantityStepper
                        quantity={line.quantity}
                        disabled={setQuantity.isPending}
                        onChange={(next) => setQuantity.mutate({ itemId: line.id, quantity: next })}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem.mutate(line.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative h-fit overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-card">
              <span className="brand-blob -right-10 -top-10 size-40 rounded-full bg-accent" />
              <h2 className="relative font-display text-xl font-extrabold">Bill Details</h2>
              <dl className="relative mt-5 space-y-3 text-sm">
                <Row label={`Item Total (${bill.itemCount})`} value={inr(bill.subtotal)} />
                <div className="flex items-start justify-between gap-3">
                  <dt className="inline-flex items-center gap-1 text-muted-foreground">
                    Delivery Fee <Info className="size-3.5" aria-hidden="true" />
                  </dt>
                  <dd className="text-right font-semibold">
                    {bill.freeDelivery ? (
                      <>
                        <span className="mr-1.5 text-muted-foreground line-through">
                          {inr(bill.deliveryFee === 0 ? 40 : bill.deliveryFee)}
                        </span>
                        <span className="font-bold text-[#006c49]">Free</span>
                      </>
                    ) : (
                      inr(bill.deliveryFee)
                    )}
                  </dd>
                </div>
                {bill.freeDelivery ? (
                  <p className="text-right text-xs font-semibold text-[#006c49]">
                    Free delivery applied!
                  </p>
                ) : (
                  <p className="text-right text-xs text-muted-foreground">
                    Add {inr(FREE_DELIVERY_THRESHOLD - bill.subtotal)} more for free delivery.
                  </p>
                )}
                <Row label="Taxes & Charges" value={inr(bill.taxes)} />
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <dt className="font-display text-base font-extrabold">Grand Total</dt>
                  <dd className="font-display text-xl font-extrabold text-primary">
                    {inr(bill.total)}
                  </dd>
                </div>
              </dl>

              {bill.savings > 0 && (
                <p className="relative mt-3 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-primary">
                  You save {inr(bill.savings)} on this order
                </p>
              )}

              <Link to="/checkout" className="relative mt-5 block">
                <Button size="lg" className="w-full">
                  Proceed to Checkout <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>

              <div className="relative mt-4 space-y-2">
                <p className="flex items-center gap-2.5 rounded-xl bg-background px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="size-4 text-[#006c49]" aria-hidden="true" /> 100% Secure
                  Checkout
                </p>
                <p className="flex items-center gap-2.5 rounded-xl bg-background px-3 py-2.5 text-xs font-semibold text-muted-foreground">
                  <Headphones className="size-4 text-primary" aria-hidden="true" /> 24/7 Customer
                  Support
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
