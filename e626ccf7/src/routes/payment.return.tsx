import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { ErrorState, LoadingState } from "@/components/nextnab/States";
import { usePlaceOrder } from "@/hooks/useOrders";
import { verifyCashfreeOrder } from "@/integrations/cashfree/server";
import { attachPaymentReference } from "@/integrations/razorpay/server";
import { takePendingCheckout } from "@/lib/pending-checkout";
import { container } from "@/lib/design-system";

const title = "Confirming payment — NextNab";
const description = "Confirming your Cashfree payment and placing your NextNab order.";

export const Route = createFileRoute("/payment/return")({
  validateSearch: (search: Record<string, unknown>): { cf_order_id?: string | undefined } => ({
    cf_order_id: typeof search["cf_order_id"] === "string" ? search["cf_order_id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturnPage,
});

function CheckoutReturnPage() {
  const navigate = useNavigate();
  const placeOrder = usePlaceOrder();
  const { cf_order_id: gatewayOrderId } = Route.useSearch();
  const [failure, setFailure] = useState<string | null>(null);
  const [label, setLabel] = useState("Confirming your payment…");
  // StrictMode double-invokes effects; settling twice would place duplicate orders.
  const settled = useRef(false);

  useEffect(() => {
    if (settled.current) return;
    settled.current = true;

    void (async () => {
      if (!gatewayOrderId) {
        setFailure("We could not read the payment reference from Cashfree.");
        return;
      }

      const pending = takePendingCheckout();
      if (!pending) {
        setFailure("Your checkout session expired. Please place the order again.");
        return;
      }
      if (pending.gatewayOrderId !== gatewayOrderId) {
        setFailure("This payment does not match the order you were checking out.");
        return;
      }

      try {
        const verified = await verifyCashfreeOrder({ data: { orderId: gatewayOrderId } });
        if (Math.abs(verified.amount - pending.amount) > 0.01) {
          setFailure("The amount paid does not match your order total.");
          return;
        }

        setLabel("Placing your order…");
        const orders = await placeOrder.mutateAsync({
          items: pending.items,
          addressId: pending.addressId,
          deliveryAddress: pending.deliveryAddress,
          method: pending.method,
          upiId: pending.upiId,
          codFee: pending.codFee,
          deliveryLat: pending.deliveryLat,
          deliveryLng: pending.deliveryLng,
        });

        const single = orders.length === 1 ? orders[0] : undefined;
        if (single) {
          await attachPaymentReference({
            data: { orderId: single.id, paymentId: verified.cfPaymentId },
          }).catch(() => undefined);
          void navigate({
            to: "/orders/$id",
            params: { id: single.id },
            search: { placed: true },
            replace: true,
          });
        } else {
          void navigate({ to: "/orders", replace: true });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setFailure(
          message === "PAYMENT_PENDING"
            ? "Cashfree is still confirming this payment. Check your orders page in a minute."
            : message === "Payment failed"
              ? "The payment did not go through. You have not been charged."
              : "We could not place your order after the payment.",
        );
      }
    })();
  }, [gatewayOrderId, navigate, placeOrder]);

  return (
    <PageShell>
      <div className={`${container} py-20`}>
        {failure ? (
          <ErrorState
            title="Payment not completed"
            description={failure}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/orders">
                  <Button>View my orders</Button>
                </Link>
                <Link to="/checkout">
                  <Button variant="outline">Back to checkout</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <LoadingState label={label} />
        )}
      </div>
    </PageShell>
  );
}
