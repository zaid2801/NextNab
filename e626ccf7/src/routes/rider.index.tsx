import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bike,
  ChevronRight,
  Clock,
  IdCard,
  IndianRupee,
  MapPin,
  Navigation,
  Package,
  Power,
  PowerOff,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  Star,
  Target,
  Wallet,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { RequireRole } from "@/components/nextnab/DashboardShell";
import { Button } from "@/components/nextnab/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/nextnab/States";
import { NotificationsBell } from "@/components/nextnab/NotificationsBell";
import { PayoutsPanel } from "@/components/nextnab/PayoutsPanel";
import { PerformanceChart, type PerformancePoint } from "@/components/nextnab/PerformanceChart";
import { LiveOrderMap } from "@/components/nextnab/LiveOrderMap";
import {
  useMyRider,
  useRiderAssignments,
  useToggleRiderOnline,
  useUpdateAssignment,
  type DeliveryAction,
  type RiderAssignment,
} from "@/hooks/useDashboard";
import {
  usePublishRiderLocation,
  usePublishSimulatedRoute,
  type RiderPoint,
} from "@/hooks/useRiderTracking";
import { supabase } from "@/integrations/supabase/client";
import { dayKey, formatTime, inr, last7Days } from "@/lib/format";
import { orderPin } from "@/lib/geo";
import { card, container } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const title = "Rider dashboard — NextNab";
const description =
  "Manage your NextNab deliveries: accept trips, update delivery status and track daily earnings in Latur.";

export const Route = createFileRoute("/rider/")({
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
  component: () => (
    <RequireRole role="rider">
      <RiderDashboard />
    </RequireRole>
  ),
});

const TABS = [
  { id: "deliveries", label: "Deliveries", icon: Package },
  { id: "earnings", label: "Earnings", icon: IndianRupee },
  { id: "performance", label: "Performance", icon: Activity },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

const DAILY_TARGET = 20;

type Step = { action: DeliveryAction; label: string };

function nextStep(item: RiderAssignment): Step | null {
  if (item.status === "delivered" || item.status === "cancelled") return null;
  if (!item.accepted_at) return { action: "accept", label: "Accept delivery" };
  if (!item.picked_up_at) return { action: "pickup", label: "Mark picked up" };
  if (item.status !== "out_for_delivery")
    return { action: "out_for_delivery", label: "Start delivery" };
  return { action: "delivered", label: "Mark delivered" };
}

function stageLabel(item: RiderAssignment): string {
  if (item.status === "delivered") return "Delivered";
  if (item.status === "cancelled") return "Cancelled";
  if (item.picked_up_at) return item.status.replace(/_/g, " ");
  if (item.accepted_at) return "Accepted";
  return "New";
}

function isActive(item: RiderAssignment): boolean {
  return item.status !== "delivered" && item.status !== "cancelled";
}

/** Rider's own live GPS, used to plot the purple dot on the active-task map. */
function useOwnLocation(active: boolean): RiderPoint | null {
  const [point, setPoint] = useState<RiderPoint | null>(null);
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) =>
        setPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          at: Date.now(),
        }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active]);
  return point;
}

function useStoreLocation(storeId: string | null) {
  return useQuery({
    queryKey: ["rider-store-location", storeId],
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-brand">
      {initials(name) || <Bike className="size-5" aria-hidden="true" />}
    </span>
  );
}

function OnlinePill({
  online,
  busy,
  onToggle,
}: {
  online: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/70 bg-card p-1 shadow-soft">
      <button
        type="button"
        disabled={busy}
        onClick={() => !online && onToggle()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
          online
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Power className="size-3.5" aria-hidden="true" /> Online
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => online && onToggle()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
          !online ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <PowerOff className="size-3.5" aria-hidden="true" /> Offline
      </button>
    </div>
  );
}

function Sidebar({
  tab,
  onTab,
  hub,
  status,
}: {
  tab: TabId;
  onTab: (next: TabId) => void;
  hub: string;
  status: string;
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors lg:rounded-2xl",
                active
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className={cn(card, "mt-4 hidden p-4 lg:block")}>
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          {hub}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{status}</p>
      </div>
    </aside>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  foot,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  foot?: React.ReactNode;
}) {
  return (
    <div className={cn(card, "p-5")}>
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      {foot && <div className="mt-2">{foot}</div>}
    </div>
  );
}

function ShareLocationButton({ orderId }: { orderId: string }) {
  const [on, setOn] = useState(false);
  const { sharing, error } = usePublishRiderLocation(orderId, on);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant={on ? "primary" : "outline"} size="sm" onClick={() => setOn((v) => !v)}>
        <Navigation className="size-4" aria-hidden="true" />
        {sharing ? "Sharing live location" : "Share live location"}
      </Button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}

function ActiveTaskCard({
  item,
  busy,
  onAct,
}: {
  item: RiderAssignment;
  busy: boolean;
  onAct: (action: DeliveryAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const outForDelivery = item.status === "out_for_delivery" && !!item.order_id;
  const { sharing: publishing, error } = usePublishRiderLocation(
    item.order_id ?? undefined,
    sharing && outForDelivery,
  );
  const ownLocation = useOwnLocation(sharing && outForDelivery);
  const next = nextStep(item);
  const { data: storeLocation } = useStoreLocation(item.order?.store_id ?? null);
  const [demo, setDemo] = useState(false);
  const destination = useMemo(() => (item.order ? orderPin(item.order) : null), [item.order]);
  const sim = usePublishSimulatedRoute(
    item.order_id ?? undefined,
    storeLocation ?? null,
    destination,
    demo && outForDelivery,
  );

  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-error">
              <Package className="size-3.5" aria-hidden="true" /> Active task
            </span>
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-primary">
              {stageLabel(item)}
            </span>
          </div>

          <p className="mt-4 font-display text-lg font-extrabold">
            {item.order ? `Order #${item.order.order_number}` : "Delivery"}
          </p>

          <ol className="mt-4 space-y-3">
            <li className="flex gap-3">
              <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-extrabold text-primary">
                P
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Pick-up
                </p>
                <p className="truncate text-sm font-semibold">{item.pickup_location ?? "Store"}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-extrabold">
                D
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Drop-off
                </p>
                <p className="truncate text-sm font-semibold">{item.drop_location ?? "Customer"}</p>
              </div>
            </li>
          </ol>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <IndianRupee className="size-4 text-primary" aria-hidden="true" />
            <span className="font-semibold text-muted-foreground">Est. earnings</span>
            <span className="font-display text-lg font-extrabold text-primary">
              {inr(Number(item.earnings ?? 0))}
            </span>
            {item.distance_km ? (
              <span className="ml-auto text-xs text-muted-foreground">{item.distance_km} km</span>
            ) : null}
          </div>

          {open && (
            <dl className="mt-4 space-y-2 rounded-2xl bg-secondary/60 p-4 text-sm">
              {item.order?.delivery_address && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-semibold text-muted-foreground">Address</dt>
                  <dd className="min-w-0 break-words">{item.order.delivery_address}</dd>
                </div>
              )}
              {item.order?.eta_minutes != null && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-semibold text-muted-foreground">ETA</dt>
                  <dd>{item.order.eta_minutes} min</dd>
                </div>
              )}
              {item.order?.total != null && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-semibold text-muted-foreground">Order total</dt>
                  <dd>{inr(Number(item.order.total))}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-semibold text-muted-foreground">Placed</dt>
                <dd>{formatTime(item.created_at)}</dd>
              </div>
            </dl>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {next && (
              <Button size="sm" loading={busy} onClick={() => onAct(next.action)}>
                {next.label}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
              {open ? "Hide details" : "View details"}
              <ChevronRight
                className={cn("size-4 transition-transform", open && "rotate-90")}
                aria-hidden="true"
              />
            </Button>
            {outForDelivery && (
              <div className="ml-auto flex flex-col items-end gap-1">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant={demo ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setDemo((v) => !v)}
                  >
                    <RouteIcon className="size-4" aria-hidden="true" />
                    {demo ? "Stop demo route" : "Demo GPS route"}
                  </Button>
                  <Button
                    variant={sharing ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSharing((v) => !v)}
                  >
                    <Navigation className="size-4" aria-hidden="true" />
                    {publishing ? "Sharing live location" : "Share live location"}
                  </Button>
                </div>
                {error && <span className="text-[11px] text-destructive">{error}</span>}
                {!destination && (
                  <span className="text-[11px] text-muted-foreground">
                    This order has no delivery pin — demo route needs one.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="relative min-h-64 border-t border-border/60 lg:border-l lg:border-t-0">
          <LiveOrderMap
            rider={publishing ? ownLocation : sim.point}
            origin={storeLocation ?? null}
            destination={destination}
          />
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-bold shadow-soft">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {publishing
              ? "Updating live"
              : sim.running
                ? "Simulated GPS — demo mode"
                : "Tap share to go live"}
            {item.distance_km ? ` · ${item.distance_km} km to drop` : ""}
          </span>
        </div>
      </div>
    </section>
  );
}

function DeliveryRow({
  item,
  busy,
  onAct,
}: {
  item: RiderAssignment;
  busy: boolean;
  onAct: (action: DeliveryAction) => void;
}) {
  const next = nextStep(item);
  return (
    <li className="grid gap-3 rounded-2xl border border-border p-4 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold">
          {item.order ? `Order #${item.order.order_number}` : "Delivery"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.pickup_location ?? "Store"} → {item.drop_location ?? "Customer"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatTime(item.created_at)}
          {item.distance_km ? ` · ${item.distance_km} km` : ""}
          {item.earnings ? ` · ${inr(Number(item.earnings))}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            item.status === "delivered"
              ? "bg-primary/15 text-primary"
              : item.status === "cancelled"
                ? "bg-error/10 text-error"
                : "bg-accent text-primary",
          )}
        >
          {stageLabel(item)}
        </span>
        {item.status === "out_for_delivery" && item.order_id && (
          <ShareLocationButton orderId={item.order_id} />
        )}
        {next && (
          <Button variant="secondary" size="sm" loading={busy} onClick={() => onAct(next.action)}>
            {next.label}
          </Button>
        )}
      </div>
    </li>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        up ? "bg-primary/15 text-primary" : "bg-error/10 text-error",
      )}
    >
      {up ? (
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="size-3.5" aria-hidden="true" />
      )}
      {Math.abs(delta)}%
    </span>
  );
}

function SettingsPanel({ rider }: { rider: NonNullable<ReturnType<typeof useMyRider>["data"]> }) {
  const rows: [string, React.ReactNode][] = [
    ["Full name", rider.full_name],
    ["Rider code", `#${rider.rider_code}`],
    ["Hub", rider.hub],
    ["Phone", rider.phone ?? "—"],
    [
      "Vehicle",
      `${rider.vehicle_type ?? "—"}${rider.vehicle_number ? ` · ${rider.vehicle_number}` : ""}`,
    ],
    [
      "Licence",
      rider.license_number
        ? `${rider.license_number.slice(0, 4)}****${rider.license_number.slice(-3)}`
        : "—",
    ],
    [
      "Verification",
      rider.is_verified ? (
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
          <BadgeCheck className="size-4" aria-hidden="true" /> Verified
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" /> Pending review
        </span>
      ),
    ],
  ];

  return (
    <section className={cn(card, "p-5 sm:p-6")}>
      <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold">
        <ShieldCheck className="size-5 text-primary" aria-hidden="true" /> Rider profile
      </h2>
      <dl className="mt-5 divide-y divide-border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]"
          >
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-accent px-4 py-3 text-xs text-primary">
        <IdCard className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        To change vehicle or KYC details, contact NextNab support — profile edits are verified by
        our team.
      </p>
    </section>
  );
}

function RiderDashboard() {
  const { data: rider, isLoading, isError, refetch } = useMyRider();
  const { data: assignments } = useRiderAssignments(rider?.id);
  const toggleOnline = useToggleRiderOnline();
  const updateAssignment = useUpdateAssignment();
  const [tab, setTab] = useState<TabId>("deliveries");

  const list = useMemo(() => assignments ?? [], [assignments]);
  const active = useMemo(() => list.filter(isActive), [list]);
  const delivered = useMemo(() => list.filter((i) => i.status === "delivered"), [list]);

  const activeTask =
    active
      .filter((i) => i.status === "out_for_delivery")
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0] ??
    active[0] ??
    null;

  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  const todayDelivered = delivered.filter(
    (i) => i.delivered_at && dayKey(i.delivered_at) === today,
  );
  const yesterdayDelivered = delivered.filter(
    (i) => i.delivered_at && dayKey(i.delivered_at) === yesterday,
  );
  const todayEarnings = todayDelivered.reduce((s, i) => s + Number(i.earnings ?? 0), 0);
  const yesterdayEarnings = yesterdayDelivered.reduce((s, i) => s + Number(i.earnings ?? 0), 0);
  const delta =
    yesterdayEarnings > 0
      ? Math.round(((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100)
      : todayEarnings > 0
        ? 100
        : 0;
  const totalEarnings = delivered.reduce((s, i) => s + Number(i.earnings ?? 0), 0);

  const performance: PerformancePoint[] = last7Days().map((day) => {
    const dayTrips = delivered.filter((i) => i.delivered_at && dayKey(i.delivered_at) === day.key);
    return {
      day: day.label,
      value: dayTrips.reduce((s, i) => s + Number(i.earnings ?? 0), 0),
      count: dayTrips.length,
    };
  });

  if (isLoading) return <LoadingState label="Loading your dashboard…" className="py-24" />;
  if (isError)
    return <ErrorState action={<Button onClick={() => void refetch()}>Try again</Button>} />;
  if (!rider)
    return (
      <EmptyState
        icon={Bike}
        title="No rider profile yet"
        description="Your rider profile is created once your partner application is approved."
        action={
          <Link to="/partner/status">
            <Button>Check application status</Button>
          </Link>
        }
      />
    );

  const act = (id: string) => (action: DeliveryAction) => updateAssignment.mutate({ id, action });

  return (
    <PageShell>
      <div className={cn(container, "py-6 lg:py-8")}>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={rider.full_name} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">
                {rider.full_name}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                  <span className="size-1.5 rounded-full bg-primary" /> Live in Latur
                </span>
                Rider #{rider.rider_code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <OnlinePill
              online={rider.is_online}
              busy={toggleOnline.isPending}
              onToggle={() => toggleOnline.mutate({ id: rider.id, isOnline: !rider.is_online })}
            />
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Sidebar
            tab={tab}
            onTab={setTab}
            hub={rider.hub}
            status={
              rider.is_online ? "Active rider · online" : "Offline · go online to receive trips"
            }
          />

          <div className="min-w-0 space-y-6">
            {tab === "deliveries" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatTile
                    icon={IndianRupee}
                    label="Today's earnings"
                    value={inr(todayEarnings)}
                    foot={<DeltaChip delta={delta} />}
                  />
                  <StatTile
                    icon={Target}
                    label="Completed orders"
                    value={`${todayDelivered.length}/${DAILY_TARGET}`}
                    foot={
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(100, (todayDelivered.length / DAILY_TARGET) * 100)}%`,
                          }}
                        />
                      </div>
                    }
                  />
                  <StatTile
                    icon={Star}
                    label="Current rating"
                    value={Number(rider.rating ?? 0).toFixed(1)}
                    foot={
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                        {delivered.length} trips delivered
                      </span>
                    }
                  />
                </div>

                {activeTask ? (
                  <ActiveTaskCard
                    item={activeTask}
                    busy={updateAssignment.isPending}
                    onAct={act(activeTask.id)}
                  />
                ) : (
                  <div className={cn(card, "p-8 text-center")}>
                    <Package
                      className="mx-auto size-8 text-muted-foreground/50"
                      aria-hidden="true"
                    />
                    <p className="mt-3 font-display font-extrabold">No active delivery</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rider.is_online
                        ? "You're online — new trips assigned to you will appear here."
                        : "Go online to start receiving delivery trips."}
                    </p>
                  </div>
                )}

                <section className={cn(card, "p-5 sm:p-6")}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-extrabold">All deliveries</h2>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {active.length} active · {delivered.length} delivered
                    </span>
                  </div>
                  {list.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No deliveries assigned yet.
                    </p>
                  ) : (
                    <ul className="mt-4 grid gap-4">
                      {list.map((item) => (
                        <DeliveryRow
                          key={item.id}
                          item={item}
                          busy={updateAssignment.isPending}
                          onAct={act(item.id)}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            {tab === "earnings" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatTile icon={IndianRupee} label="Today" value={inr(todayEarnings)} />
                  <StatTile icon={Wallet} label="Total earned" value={inr(totalEarnings)} />
                  <StatTile icon={Package} label="Delivered trips" value={delivered.length} />
                </div>
                <PerformanceChart title="Earnings — last 7 days" data={performance} isMoney />
              </>
            )}

            {tab === "performance" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatTile
                    icon={Star}
                    label="Rating"
                    value={Number(rider.rating ?? 0).toFixed(1)}
                  />
                  <StatTile icon={Package} label="Delivered" value={delivered.length} />
                  <StatTile
                    icon={Target}
                    label="Today vs target"
                    value={`${todayDelivered.length}/${DAILY_TARGET}`}
                  />
                </div>
                <PerformanceChart title="Trips — last 7 days" data={performance} />
              </>
            )}

            {tab === "payouts" && <PayoutsPanel partnerId={rider.id} />}

            {tab === "settings" && <SettingsPanel rider={rider} />}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
