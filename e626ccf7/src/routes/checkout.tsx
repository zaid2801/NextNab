import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  Landmark,
  LocateFixed,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { ProcessingPayment } from "@/components/nextnab/ProcessingPayment";
import { PinMap, type LatLng } from "@/components/nextnab/PinMap";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses } from "@/hooks/useAddresses";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useStores } from "@/hooks/useCatalog";
import { openRazorpayCheckout, type RazorpayResult } from "@/integrations/razorpay/client";
import {
  attachPaymentReference,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/integrations/razorpay/server";
import { openCashfreeCheckout } from "@/integrations/cashfree/client";
import { createCashfreeOrder } from "@/integrations/cashfree/server";
import { getGatewayConfig, type GatewayId } from "@/integrations/gateways";
import { clearPendingCheckout, stashPendingCheckout } from "@/lib/pending-checkout";
import { container } from "@/lib/design-system";
import { inr } from "@/lib/format";
import { COD_HANDLING_FEE, summarise } from "@/lib/cart-math";
import type { CartLine, PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";

const title = "Checkout — NextNab";
const description = "Confirm your delivery address and pay by UPI, card or cash on delivery.";

const GATEWAY_LABELS: Record<GatewayId, string> = {
  cashfree: "Cashfree",
  razorpay: "Razorpay",
};

const LATUR_CENTER: LatLng = { lat: 18.4088, lng: 76.5604 };

export const Route = createFileRoute("/checkout")({
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
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines, isLoading } = useCart();
  const { addresses, addAddress } = useAddresses();
  const placeOrder = usePlaceOrder();

  const [selected, setSelected] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [changingAddress, setChangingAddress] = useState(false);
  const [processing, setProcessing] = useState<{ amount: number; orderId: string } | null>(null);
  const [chosenGateway, setChosenGateway] = useState<GatewayId | null>(null);
  const [pin, setPin] = useState<LatLng>(LATUR_CENTER);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setPin({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => undefined,
      { maximumAge: 60000, timeout: 8000 },
    );
  }, []);

  const { data: gateways } = useQuery({
    queryKey: ["gateway-config"],
    queryFn: () => getGatewayConfig(),
    staleTime: Infinity,
  });

  const availableGateways = (["cashfree", "razorpay"] as const).filter((id) => gateways?.[id]);
  // Cashfree first: it is the preferred gateway for this deployment.
  const activeGateway = chosenGateway ?? availableGateways[0] ?? null;

  const addressId = selected ?? addresses[0]?.id ?? null;
  const address = addresses.find((item) => item.id === addressId) ?? null;
  const codFee = method === "cod" ? COD_HANDLING_FEE : 0;

  const { data: stores = [] } = useStores();
  const storeNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const store of stores) map.set(store.id, store.name);
    return map;
  }, [stores]);

  const storeGroups = useMemo(() => {
    const map = new Map<string, CartLine[]>();
    for (const line of lines) {
      const key = line.product?.store_id ?? "unknown";
      map.set(key, [...(map.get(key) ?? []), line]);
    }
    return [...map.entries()].map(([storeId, group]) => ({
      storeId,
      storeName: storeNames.get(storeId) ?? "Local store",
      lines: group,
      bill: summarise(group, codFee),
    }));
  }, [lines, codFee, storeNames]);

  const bill = useMemo(
    () =>
      storeGroups.reduce(
        (acc, group) => ({
          subtotal: acc.subtotal + group.bill.subtotal,
          deliveryFee: acc.deliveryFee + group.bill.deliveryFee,
          taxes: acc.taxes + group.bill.taxes,
          total: acc.total + group.bill.total,
          savings: acc.savings + group.bill.savings,
          itemCount: acc.itemCount + group.bill.itemCount,
          freeDelivery: acc.freeDelivery && group.bill.freeDelivery,
        }),
        {
          subtotal: 0,
          deliveryFee: 0,
          taxes: 0,
          total: 0,
          savings: 0,
          itemCount: 0,
          freeDelivery: true,
        },
      ),
    [storeGroups],
  );

  if (!user) {
    return (
      <PageShell>
        <div className={`${container} py-24 text-center`}>
          <h1 className="font-display text-2xl font-extrabold">Sign in to checkout</h1>
          <Link to="/login" className="mt-6 inline-block">
            <Button size="lg">Login / Sign up</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  async function handleNewAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const created = await addAddress.mutateAsync({
      label: String(form.get("label") || "Home"),
      contact_name: String(form.get("contact_name") || ""),
      contact_phone: String(form.get("contact_phone") || ""),
      line1: String(form.get("line1") || ""),
      line2: String(form.get("line2") || ""),
      city: String(form.get("city") || "Latur"),
      state: String(form.get("state") || "MH"),
      pincode: String(form.get("pincode") || ""),
      is_default: addresses.length === 0,
    });
    setSelected(created.id);
    setShowForm(false);
    setChangingAddress(false);
  }

  async function handlePlaceOrder() {
    if (!address) {
      toast.error("Add a delivery address first");
      return;
    }
    if (method === "upi" && !upiId.trim().includes("@")) {
      toast.error("Enter a valid UPI ID (name@bank)");
      return;
    }

    const deliveryAddress = `${address.line1}${address.line2 ? `, ${address.line2}` : ""}, ${address.city}, ${address.state} ${address.pincode}`;
    const items = lines.map((line) => ({
      product_id: line.product_id,
      quantity: line.quantity,
    }));

    // Cashfree's Drop-in leaves the site and comes back to /checkout/return, so
    // the order can only be placed after that redirect. Stash the intent first.
    if (method !== "cod" && activeGateway === "cashfree") {
      if (!user) {
        toast.error("Sign in again to continue");
        return;
      }
      try {
        const created = await createCashfreeOrder({
          data: {
            amountInr: bill.total,
            customerId: user.id,
            customerEmail: user.email ?? "",
            customerPhone: address.contact_phone,
          },
        });
        stashPendingCheckout({
          gatewayOrderId: created.cashfreeOrderId,
          amount: bill.total,
          addressId: address.id,
          deliveryAddress,
          method,
          upiId: method === "upi" ? upiId.trim() : undefined,
          codFee,
          items,
          deliveryLat: pin.lat,
          deliveryLng: pin.lng,
        });
        await openCashfreeCheckout({
          paymentSessionId: created.paymentSessionId,
          mode: created.mode,
        });
      } catch {
        clearPendingCheckout();
        toast.error("Could not start the Cashfree payment. Please try again.");
      }
      return;
    }

    // Razorpay settles in-page, so collect the money before creating the order.
    let gateway: RazorpayResult | null = null;
    if (method !== "cod" && activeGateway === "razorpay") {
      try {
        const created = await createRazorpayOrder({
          data: { amountInr: bill.total, receipt: `nn${Date.now()}` },
        });
        gateway = await openRazorpayCheckout({
          keyId: created.keyId,
          razorpayOrderId: created.razorpayOrderId,
          amountInr: bill.total,
          prefill: user?.email ? { email: user.email } : undefined,
        });
        await verifyRazorpayPayment({ data: gateway });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(
          message === "Payment cancelled"
            ? "Payment cancelled"
            : "Payment failed. Please try again.",
        );
        return;
      }
    }

    const orders = await placeOrder.mutateAsync({
      items,
      addressId: address.id,
      deliveryAddress,
      method,
      upiId: method === "upi" ? upiId.trim() : undefined,
      codFee,
      deliveryLat: pin.lat,
      deliveryLng: pin.lng,
    });
    if (orders.length === 1 && orders[0]) {
      if (method === "cod") {
        toast.success("Order placed! Pay when it arrives.");
        void navigate({ to: "/orders/$id", params: { id: orders[0].id } });
      } else if (gateway) {
        await attachPaymentReference({
          data: { orderId: orders[0].id, paymentId: gateway.razorpayPaymentId },
        }).catch(() => undefined);
        toast.success("Payment confirmed");
        void navigate({
          to: "/orders/$id",
          params: { id: orders[0].id },
          search: { placed: true },
        });
      } else {
        setProcessing({ amount: bill.total, orderId: orders[0].id });
      }
    } else {
      toast.success(`${orders.length} orders placed — one per store!`);
      void navigate({ to: "/orders" });
    }
  }

  if (placeOrder.isPending) {
    return (
      <PageShell>
        <div className={`${container} grid place-items-center py-24`}>
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
            <div className="relative mx-auto size-28">
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-accent border-t-primary" />
              <span className="absolute inset-6 grid place-items-center rounded-full bg-secondary text-primary">
                <ShieldCheck className="size-7" aria-hidden="true" />
              </span>
            </div>
            <h1 className="mt-6 font-display text-2xl font-extrabold">Verifying Details</h1>
            <p className="mt-1 text-sm text-muted-foreground">Confirming payment method…</p>
            <dl className="mt-6 space-y-2 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-display font-extrabold">{inr(bill.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Merchant</dt>
                <dd className="font-semibold">NextNab Latur</dd>
              </div>
            </dl>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive">
              <AlertTriangle className="size-3.5" aria-hidden="true" /> Please do not refresh or
              close this page
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {processing && (
        <ProcessingPayment
          amount={processing.amount}
          onComplete={() =>
            void navigate({
              to: "/orders/$id",
              params: { id: processing.orderId },
              search: { placed: true },
            })
          }
        />
      )}
      <div className={`${container} py-10`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ol className="flex items-center gap-3">
            <Step done={!!address} active={!address} index={1} label="Address" />
            <span className="h-px w-8 bg-border" aria-hidden="true" />
            <Step done={false} active={!!address} index={2} label="Payment" />
            <span className="h-px w-8 bg-border" aria-hidden="true" />
            <Step done={false} active={false} index={3} label="Review" />
          </ol>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-bold shadow-soft">
            <ShieldCheck className="size-4 text-[#006c49]" aria-hidden="true" /> 256-bit SSL Secured
            Checkout
          </span>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-24 text-muted-foreground">Loading…</div>
        ) : lines.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/groceries" className="mt-6 inline-block">
              <Button>Start shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold">
                    <MapPin className="size-5 text-primary" aria-hidden="true" /> Delivery Address
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingAddress((value) => !value);
                      setShowForm(false);
                    }}
                    className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-accent"
                  >
                    Change
                  </button>
                </div>

                {address && !changingAddress ? (
                  <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl bg-secondary p-5">
                    <div className="text-sm">
                      <p className="font-display font-bold">{address.contact_name}</p>
                      <p className="mt-1 text-muted-foreground">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""},
                      </p>
                      <p className="text-muted-foreground">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-muted-foreground">
                        <Smartphone className="size-3.5" aria-hidden="true" />
                        {address.contact_phone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {addresses.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelected(item.id);
                          setChangingAddress(false);
                        }}
                        className={cn(
                          "flex w-full gap-3 rounded-2xl border p-4 text-left transition-colors",
                          item.id === addressId
                            ? "border-brand bg-accent/60"
                            : "border-border hover:border-brand/50",
                        )}
                      >
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-sm">
                          <span className="font-display font-bold">{item.label}</span>
                          <span className="block text-muted-foreground">
                            {item.contact_name} · {item.contact_phone}
                          </span>
                          <span className="block text-muted-foreground">
                            {item.line1}
                            {item.line2 ? `, ${item.line2}` : ""}, {item.city}, {item.state}{" "}
                            {item.pincode}
                          </span>
                        </span>
                      </button>
                    ))}
                    {addresses.length === 0 && !showForm && (
                      <p className="text-sm text-muted-foreground">
                        No saved addresses yet — add one to continue.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowForm((value) => !value)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      <Plus className="size-4" aria-hidden="true" /> Add new address
                    </button>
                  </div>
                )}

                {(showForm || addresses.length === 0) && (
                  <form onSubmit={handleNewAddress} className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Field name="label" label="Label" placeholder="Home" />
                    <Field name="contact_name" label="Full name" required />
                    <Field name="contact_phone" label="Phone" required />
                    <Field name="pincode" label="Pincode" required />
                    <Field
                      name="line1"
                      label="House / Flat, street"
                      required
                      className="sm:col-span-2"
                    />
                    <Field name="line2" label="Landmark (optional)" className="sm:col-span-2" />
                    <Field name="city" label="City" defaultValue="Latur" />
                    <Field name="state" label="State" defaultValue="MH" />
                    <div className="sm:col-span-2">
                      <Button type="submit" loading={addAddress.isPending}>
                        Save address
                      </Button>
                    </div>
                  </form>
                )}
              </section>

              <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
                <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold">
                  <LocateFixed className="size-5 text-primary" aria-hidden="true" /> Delivery pin
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drag the pin (or tap the map) to your exact drop point — the rider navigates to
                  this pin for live tracking.
                </p>
                <div className="mt-4">
                  <PinMap value={pin} onChange={setPin} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
                        toast.error("This device does not support location");
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (position) =>
                          setPin({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                          }),
                        () => toast.error("Could not read your location"),
                        { enableHighAccuracy: true, timeout: 8000 },
                      );
                    }}
                  >
                    <LocateFixed className="size-4" aria-hidden="true" /> Use my current location
                  </Button>
                </div>
              </section>

              <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
                <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold">
                  <Wallet className="size-5 text-primary" aria-hidden="true" /> Payment Method
                </h2>

                <div className="mt-4 space-y-3">
                  <MethodOption
                    active={method === "upi"}
                    onSelect={() => setMethod("upi")}
                    title="UPI (GPay, PhonePe, Paytm)"
                    hint="Pay instantly using any UPI app."
                    tag="UPI"
                  >
                    {method === "upi" && (
                      <div className="mt-3">
                        <label className="block rounded-xl border border-border bg-background p-3">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            Enter UPI ID
                          </span>
                          <input
                            value={upiId}
                            onChange={(event) => {
                              setUpiId(event.target.value);
                              setUpiVerified(false);
                            }}
                            placeholder="name@upi"
                            className="mt-0.5 w-full bg-transparent text-sm outline-none"
                          />
                        </label>
                        <Button
                          size="sm"
                          className="mt-3"
                          disabled={!upiId.trim().includes("@")}
                          onClick={() => setUpiVerified(true)}
                        >
                          Verify <BadgeCheck className="size-4" aria-hidden="true" />
                        </Button>
                        {upiVerified && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#006c49]">
                            <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified:{" "}
                            {upiId.trim()}
                          </p>
                        )}
                      </div>
                    )}
                  </MethodOption>

                  <MethodOption
                    active={method === "card"}
                    onSelect={() => setMethod("card")}
                    title="Credit / Debit Card"
                    hint="Save card securely for faster payments."
                    tag="VISA · MC"
                  />

                  <MethodOption
                    active={method === "cod"}
                    onSelect={() => setMethod("cod")}
                    title="Cash on Delivery"
                    hint="Pay when you receive the order."
                  >
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#ffeed6] px-3 py-1 text-[11px] font-semibold text-[#7d4e00]">
                      <AlertTriangle className="size-3" aria-hidden="true" />{" "}
                      {inr(COD_HANDLING_FEE)} extra handling fee applies
                    </p>
                  </MethodOption>
                </div>

                {method !== "cod" && availableGateways.length > 0 && (
                  <div className="mt-5">
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                      <Landmark className="size-4 text-primary" aria-hidden="true" /> Payment
                      gateway
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableGateways.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setChosenGateway(id)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                            activeGateway === id
                              ? "border-primary bg-accent text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50",
                          )}
                        >
                          {GATEWAY_LABELS[id]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-4 text-xs text-muted-foreground">
                  {method === "cod"
                    ? "Pay the delivery partner in cash when the order arrives."
                    : activeGateway
                      ? `Securely processed by ${GATEWAY_LABELS[activeGateway]}.`
                      : "No payment gateway is configured yet — orders are recorded in test mode."}
                </p>
              </section>
            </div>

            <div className="relative h-fit overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-card">
              <span className="brand-blob -right-12 -top-12 size-44 rounded-full bg-accent" />
              <h2 className="relative font-display text-xl font-extrabold">Order Summary</h2>

              {storeGroups.length > 1 && (
                <p className="relative mt-3 rounded-2xl bg-accent px-3 py-2 text-xs font-semibold text-primary">
                  Items from {storeGroups.length} stores will be placed as separate orders and
                  delivered separately.
                </p>
              )}

              <ul className="relative mt-4 space-y-3">
                {storeGroups.flatMap((group) =>
                  group.lines.map((line) => (
                    <li key={line.id} className="flex items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                        <ShoppingBag className="size-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {line.product?.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {line.product?.unit} • Qty: {line.quantity}
                          {storeGroups.length > 1 ? ` • ${group.storeName}` : ""}
                        </span>
                      </span>
                      <span className="text-sm font-bold">
                        {inr(Number(line.product?.price ?? 0) * line.quantity)}
                      </span>
                    </li>
                  )),
                )}
              </ul>

              <dl className="relative mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
                <Row label="Subtotal" value={inr(bill.subtotal)} />
                <Row
                  label="Delivery Fee"
                  value={bill.freeDelivery ? "FREE" : inr(bill.deliveryFee)}
                  freeValue={bill.freeDelivery}
                />
                <Row label="Taxes & Charges" value={inr(bill.taxes)} />
                {codFee > 0 && <Row label="COD handling (per order)" value={inr(codFee)} />}
              </dl>

              <div className="relative mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">To Pay</p>
                  <p className="font-display text-3xl font-extrabold text-primary">
                    {inr(bill.total)}
                  </p>
                </div>
                {bill.savings > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f2e4] px-3 py-1 text-xs font-bold text-[#006c49]">
                    <BadgeCheck className="size-3.5" aria-hidden="true" /> Saved {inr(bill.savings)}
                  </span>
                )}
              </div>

              <Button
                size="lg"
                className="relative mt-5 w-full"
                loading={placeOrder.isPending}
                onClick={handlePlaceOrder}
              >
                {placeOrder.isPending ? "Placing order…" : "Pay & Place Order"}{" "}
                {!placeOrder.isPending && <ArrowRight className="size-4" aria-hidden="true" />}
              </Button>
              <p className="relative mt-3 text-center text-xs text-muted-foreground">
                By placing this order, you agree to our Terms &amp; Conditions.
              </p>

              <div className="relative mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" aria-hidden="true" /> PCI-DSS Compliant
                </span>
                <span className="h-3 w-px bg-border" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="size-3.5" aria-hidden="true" /> Secure Payment
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Step({
  done,
  active,
  index,
  label,
}: {
  done: boolean;
  active: boolean;
  index: number;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full font-display text-sm font-bold",
          done
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-primary text-primary-foreground shadow-brand"
              : "bg-secondary text-muted-foreground",
        )}
      >
        {done ? <Check className="size-4" aria-hidden="true" /> : index}
      </span>
      <span
        className={cn(
          "font-display text-sm font-extrabold",
          !done && !active && "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </li>
  );
}

function MethodOption({
  active,
  onSelect,
  title,
  hint,
  tag,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
  tag?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        active ? "border-primary bg-accent/40 shadow-soft" : "border-transparent bg-secondary",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 text-left">
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
            active ? "border-primary" : "border-muted-foreground/50",
          )}
          aria-hidden="true"
        >
          {active && <span className="size-2.5 rounded-full bg-primary" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="font-display text-base font-extrabold">{title}</span>
            {tag && (
              <span className="rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-bold text-muted-foreground">
                {tag}
              </span>
            )}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>
        </span>
      </button>
      {children && <div className="pl-8">{children}</div>}
    </div>
  );
}

function Field({
  name,
  label,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string }) {
  return (
    <label className={cn("block text-sm", className)}>
      <span className="font-semibold">{label}</span>
      <input
        name={name}
        className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-brand"
        {...rest}
      />
    </label>
  );
}

function Row({ label, value, freeValue }: { label: string; value: string; freeValue?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold", freeValue && "font-bold text-[#006c49]")}>{value}</dd>
    </div>
  );
}
