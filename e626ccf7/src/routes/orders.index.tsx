import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Package, XCircle } from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { useAuth } from "@/hooks/useAuth";
import { ORDER_LABELS, useCancelOrder, useOrders } from "@/hooks/useOrders";
import { card, container } from "@/lib/design-system";
import { formatDate, inr } from "@/lib/format";

const title = "My Orders — NextNab";
const description = "Track your NextNab grocery orders and delivery status in Latur.";

export const Route = createFileRoute("/orders/")({
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
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useOrders();
  const cancelOrder = useCancelOrder();

  if (!user) {
    return (
      <PageShell>
        <div className={`${container} py-24 text-center`}>
          <Package className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Sign in to see your orders</h1>
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
        <h1 className="font-display text-3xl font-extrabold tracking-tight">My Orders</h1>

        {isLoading ? (
          <div className="grid place-items-center py-24 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No orders yet.</p>
            <Link to="/groceries" className="mt-6 inline-block">
              <Button>Order groceries</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {orders.map((order) => {
              const cancellable =
                order.status === "placed" || order.status === "merchant_confirmed";
              return (
                <Link
                  key={order.id}
                  to="/orders/$id"
                  params={{ id: order.id }}
                  className={`${card} flex flex-wrap items-center gap-4 p-5 hover:shadow-card-hover`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold">#{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.placed_at)} · {order.order_items.length} items
                    </p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-primary">
                    {ORDER_LABELS[order.status]}
                  </span>
                  <p className="font-display text-base font-extrabold">{inr(order.total)}</p>
                  {cancellable && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={cancelOrder.isPending}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (window.confirm(`Cancel order #${order.order_number}?`)) {
                          cancelOrder.mutate(order.id);
                        }
                      }}
                    >
                      <XCircle className="size-4" aria-hidden="true" /> Cancel
                    </Button>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
