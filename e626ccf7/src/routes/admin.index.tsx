import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Bike, ClipboardList, Package, Star, Store, Users, Wrench } from "lucide-react";
import { DashboardShell, Panel, RequireRole } from "@/components/nextnab/DashboardShell";
import { StatCard } from "@/components/nextnab/StatCard";
import { Button } from "@/components/nextnab/Button";
import { LiveDeliveryMap } from "@/components/nextnab/LiveDeliveryMap";
import { LoadingState, ErrorState, EmptyState } from "@/components/nextnab/States";
import {
  useAdminOrders,
  useAdminPayments,
  useAdminProducts,
  useAdminProviders,
  useAdminReviews,
  useAdminRiders,
  useAdminSetOrderStatus,
  useAdminSetPartnerFlag,
  useAdminSetPaymentStatus,
  useAdminStores,
  useAdminUsers,
  useAllApplications,
  useCreatePayout,
  usePlatformStats,
  useReviewApplication,
  type PartnerFlagTarget,
} from "@/hooks/useAdmin";
import { useAdminPayouts } from "@/hooks/usePayouts";
import { card } from "@/lib/design-system";
import { formatDate, inr } from "@/lib/format";
import { orderPin } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { OrderStatus, PartnerApplication, PaymentStatus } from "@/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin control panel — NextNab" },
      {
        name: "description",
        content:
          "Review shopkeeper, service provider and rider applications and monitor NextNab activity across Latur.",
      },
      { property: "og:title", content: "Admin control panel — NextNab" },
      {
        property: "og:description",
        content: "Approve partners and track orders, bookings and sign-ups on NextNab.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const FILTERS = [
  { key: "pending", label: "Needs review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const TYPE_LABEL: Record<string, string> = {
  shopkeeper: "Shopkeeper",
  service_provider: "Service provider",
  rider: "Delivery rider",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  submitted: "bg-accent text-primary",
  under_review: "bg-accent text-primary",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "applications", label: "Applications" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "payouts", label: "Payouts" },
  { key: "stores", label: "Stores" },
  { key: "products", label: "Products" },
  { key: "providers", label: "Providers" },
  { key: "riders", label: "Riders" },
  { key: "users", label: "Users" },
  { key: "reviews", label: "Reviews" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function AdminPage() {
  return (
    <RequireRole role="admin">
      <AdminDashboard />
    </RequireRole>
  );
}

function Badge({ tone, children }: { tone: "good" | "bad" | "muted"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        tone === "good"
          ? "bg-emerald-100 text-emerald-700"
          : tone === "bad"
            ? "bg-rose-100 text-rose-700"
            : "bg-secondary text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function RowsTable<T>({
  rows,
  columns,
}: {
  rows: T[];
  columns: { header: string; render: (row: T) => ReactNode }[];
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No records yet.</p>;
  }
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            {columns.map((col) => (
              <th key={col.header} className="px-3 py-2 font-bold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/60 last:border-0">
              {columns.map((col) => (
                <td key={col.header} className="px-3 py-2.5 align-middle">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionBody({
  isLoading,
  isError,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingState label="Loading…" />;
  if (isError) return <ErrorState description="Couldn't load this section." />;
  return <>{children}</>;
}

function FlagToggle({
  target,
  id,
  value,
  labelOn,
  labelOff,
}: {
  target: PartnerFlagTarget;
  id: string;
  value: boolean;
  labelOn: string;
  labelOff: string;
}) {
  const setFlag = useAdminSetPartnerFlag();
  return (
    <Button
      size="sm"
      variant={value ? "outline" : "primary"}
      loading={setFlag.isPending}
      onClick={() => setFlag.mutate({ target, id, value: !value })}
    >
      {value ? labelOn : labelOff}
    </Button>
  );
}

const selectCls =
  "h-9 rounded-xl border border-border bg-surface-low px-2 text-sm outline-none focus:border-brand";

const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "merchant_confirmed",
  "partner_assigned",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function OrdersSection() {
  const { data, isLoading, isError } = useAdminOrders();
  const setStatus = useAdminSetOrderStatus();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          {
            header: "Order",
            render: (o) => <span className="font-semibold">#{o.order_number}</span>,
          },
          {
            header: "Status",
            render: (o) => (
              <Badge
                tone={
                  o.status === "delivered" ? "good" : o.status === "cancelled" ? "bad" : "muted"
                }
              >
                {o.status.replace(/_/g, " ")}
              </Badge>
            ),
          },
          { header: "Total", render: (o) => inr(o.total) },
          { header: "Placed", render: (o) => formatDate(o.placed_at) },
          {
            header: "Set status",
            render: (o) => (
              <select
                aria-label={`Set status for order #${o.order_number}`}
                value={o.status}
                disabled={setStatus.isPending}
                onChange={(event) =>
                  setStatus.mutate({
                    id: o.id,
                    status: event.target.value as OrderStatus,
                  })
                }
                className={selectCls}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            ),
          },
          {
            header: "Live tracking",
            render: (o) =>
              o.status === "out_for_delivery" ? (
                <LiveDeliveryMap orderId={o.id} destination={orderPin(o)} />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
        ]}
      />
    </SectionBody>
  );
}

function PaymentsSection() {
  const { data, isLoading, isError } = useAdminPayments();
  const setPayment = useAdminSetPaymentStatus();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          { header: "Method", render: (p) => <span className="capitalize">{p.method}</span> },
          {
            header: "Status",
            render: (p) => (
              <Badge
                tone={p.status === "success" ? "good" : p.status === "failed" ? "bad" : "muted"}
              >
                {p.status}
              </Badge>
            ),
          },
          { header: "Amount", render: (p) => inr(p.amount) },
          { header: "Reference", render: (p) => p.reference ?? "—" },
          { header: "When", render: (p) => formatDate(p.created_at) },
          {
            header: "Actions",
            render: (p) => (
              <div className="flex gap-2">
                {p.status !== "success" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={setPayment.isPending && setPayment.variables?.status === "success"}
                    disabled={setPayment.isPending}
                    onClick={() =>
                      setPayment.mutate({ id: p.id, status: "success" as PaymentStatus })
                    }
                  >
                    Mark paid
                  </Button>
                )}
                {p.status !== "failed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={setPayment.isPending && setPayment.variables?.status === "failed"}
                    disabled={setPayment.isPending}
                    onClick={() =>
                      setPayment.mutate({ id: p.id, status: "failed" as PaymentStatus })
                    }
                  >
                    Mark failed
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />
    </SectionBody>
  );
}

function StoresSection() {
  const { data, isLoading, isError } = useAdminStores();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          { header: "Store", render: (s) => <span className="font-semibold">{s.name}</span> },
          { header: "City", render: (s) => s.city },
          {
            header: "Status",
            render: (s) => (
              <Badge tone={s.is_online && s.is_live ? "good" : "muted"}>
                {s.is_online && s.is_live ? "Open" : "Closed"}
              </Badge>
            ),
          },
          {
            header: "Rating",
            render: (s) => (s.rating != null ? Number(s.rating).toFixed(1) : "—"),
          },
          {
            header: "Actions",
            render: (s) => (
              <FlagToggle
                target={{ table: "stores", flag: "is_live" }}
                id={s.id}
                value={s.is_live}
                labelOn="Unpublish"
                labelOff="Publish"
              />
            ),
          },
        ]}
      />
    </SectionBody>
  );
}

function ProductsSection() {
  const { data, isLoading, isError } = useAdminProducts();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          { header: "Product", render: (p) => <span className="font-semibold">{p.name}</span> },
          { header: "Price", render: (p) => inr(p.price) },
          {
            header: "Stock",
            render: (p) => <Badge tone={p.stock <= 5 ? "bad" : "good"}>{p.stock}</Badge>,
          },
          {
            header: "Live",
            render: (p) => (
              <Badge tone={p.is_live ? "good" : "muted"}>{p.is_live ? "Yes" : "No"}</Badge>
            ),
          },
        ]}
      />
    </SectionBody>
  );
}

function ProvidersSection() {
  const { data, isLoading, isError } = useAdminProviders();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          {
            header: "Provider",
            render: (p) => <span className="font-semibold">{p.full_name}</span>,
          },
          {
            header: "Verified",
            render: (p) => (
              <Badge tone={p.is_verified ? "good" : "muted"}>{p.is_verified ? "Yes" : "No"}</Badge>
            ),
          },
          {
            header: "Online",
            render: (p) => (
              <Badge tone={p.is_online ? "good" : "muted"}>{p.is_online ? "Yes" : "No"}</Badge>
            ),
          },
          { header: "Rating", render: (p) => Number(p.rating).toFixed(1) },
          { header: "Jobs", render: (p) => p.jobs_done },
          {
            header: "Actions",
            render: (p) => (
              <FlagToggle
                target={{ table: "service_providers", flag: "is_verified" }}
                id={p.id}
                value={p.is_verified}
                labelOn="Unverify"
                labelOff="Verify"
              />
            ),
          },
        ]}
      />
    </SectionBody>
  );
}

function RidersSection() {
  const { data, isLoading, isError } = useAdminRiders();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          { header: "Rider", render: (r) => <span className="font-semibold">{r.full_name}</span> },
          { header: "Code", render: (r) => r.rider_code },
          { header: "Hub", render: (r) => r.hub },
          { header: "Vehicle", render: (r) => r.vehicle_type },
          {
            header: "Online",
            render: (r) => (
              <Badge tone={r.is_online ? "good" : "muted"}>{r.is_online ? "Yes" : "No"}</Badge>
            ),
          },
          {
            header: "Actions",
            render: (r) => (
              <FlagToggle
                target={{ table: "riders", flag: "is_verified" }}
                id={r.id}
                value={r.is_verified}
                labelOn="Unverify"
                labelOff="Verify"
              />
            ),
          },
        ]}
      />
    </SectionBody>
  );
}

function UsersSection() {
  const { data, isLoading, isError } = useAdminUsers();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          {
            header: "Name",
            render: (u) => <span className="font-semibold">{u.full_name ?? "—"}</span>,
          },
          { header: "Phone", render: (u) => u.phone ?? "—" },
          { header: "Joined", render: (u) => formatDate(u.created_at) },
        ]}
      />
    </SectionBody>
  );
}

function ReviewsSection() {
  const { data, isLoading, isError } = useAdminReviews();
  return (
    <SectionBody isLoading={isLoading} isError={isError}>
      <RowsTable
        rows={data ?? []}
        columns={[
          {
            header: "Author",
            render: (r) => <span className="font-semibold">{r.author_name}</span>,
          },
          {
            header: "Rating",
            render: (r) => (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="size-3.5 text-primary" aria-hidden="true" />
                {Number(r.rating).toFixed(1)}
              </span>
            ),
          },
          {
            header: "Target",
            render: (r) => (r.store_id ? "Store" : r.provider_id ? "Provider" : "Order"),
          },
          {
            header: "Comment",
            render: (r) => <span className="text-muted-foreground">{r.comment ?? "—"}</span>,
          },
          { header: "When", render: (r) => formatDate(r.created_at) },
        ]}
      />
    </SectionBody>
  );
}

function PayoutsSection() {
  const { data: payouts, isLoading, isError } = useAdminPayouts();
  const { data: stores } = useAdminStores();
  const { data: providers } = useAdminProviders();
  const { data: riders } = useAdminRiders();
  const createPayout = useCreatePayout();

  const [showForm, setShowForm] = useState(false);
  const [partnerType, setPartnerType] = useState<"shopkeeper" | "service_provider" | "rider">(
    "shopkeeper",
  );
  const [partnerId, setPartnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [note, setNote] = useState("");

  const options = useMemo(() => {
    if (partnerType === "shopkeeper")
      return (stores ?? []).map((store) => ({
        id: store.id,
        userId: store.owner_id,
        label: store.name,
      }));
    if (partnerType === "service_provider")
      return (providers ?? []).map((provider) => ({
        id: provider.id,
        userId: provider.user_id,
        label: provider.full_name,
      }));
    return (riders ?? []).map((rider) => ({
      id: rider.id,
      userId: rider.user_id,
      label: `${rider.full_name} (${rider.rider_code})`,
    }));
  }, [partnerType, stores, providers, riders]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const partner = options.find((option) => option.id === partnerId);
    const parsedAmount = Number(amount);
    if (!partner || !partner.userId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    if (!periodStart || !periodEnd) return;
    createPayout.mutate(
      {
        partnerType,
        partnerId: partner.id,
        userId: partner.userId,
        amount: parsedAmount,
        periodStart,
        periodEnd,
        note,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setPartnerId("");
          setAmount("");
          setNote("");
        },
      },
    );
  }

  return (
    <Panel
      title="Partner payouts"
      action={
        <Button size="sm" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "Record payout"}
        </Button>
      }
    >
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 grid gap-3 rounded-2xl border border-brand/40 bg-surface-low p-4 sm:grid-cols-2"
        >
          <label className="text-sm font-semibold">
            Partner type
            <select
              value={partnerType}
              onChange={(event) => {
                setPartnerType(event.target.value as typeof partnerType);
                setPartnerId("");
              }}
              className={cn(selectCls, "mt-1 h-11 w-full")}
            >
              <option value="shopkeeper">Shopkeeper</option>
              <option value="service_provider">Service provider</option>
              <option value="rider">Rider</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Partner
            <select
              value={partnerId}
              onChange={(event) => setPartnerId(event.target.value)}
              className={cn(selectCls, "mt-1 h-11 w-full")}
              required
            >
              <option value="">Select partner…</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Amount (₹)
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={cn(selectCls, "mt-1 h-11 w-full")}
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Note (optional)
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Weekly settlement"
              className={cn(selectCls, "mt-1 h-11 w-full")}
            />
          </label>
          <label className="text-sm font-semibold">
            Period start
            <input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className={cn(selectCls, "mt-1 h-11 w-full")}
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Period end
            <input
              type="date"
              value={periodEnd}
              min={periodStart || undefined}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className={cn(selectCls, "mt-1 h-11 w-full")}
              required
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" loading={createPayout.isPending}>
              Record payout
            </Button>
          </div>
        </form>
      )}

      <SectionBody isLoading={isLoading} isError={isError}>
        <RowsTable
          rows={payouts ?? []}
          columns={[
            {
              header: "Partner",
              render: (p) => (
                <span className="font-semibold capitalize">
                  {p.partner_type.replace(/_/g, " ")}
                </span>
              ),
            },
            { header: "Amount", render: (p) => inr(p.amount) },
            {
              header: "Period",
              render: (p) => `${formatDate(p.period_start)} → ${formatDate(p.period_end)}`,
            },
            {
              header: "Status",
              render: (p) => (
                <Badge tone={p.status === "paid" ? "good" : "muted"}>{p.status}</Badge>
              ),
            },
            { header: "Note", render: (p) => p.note ?? "—" },
            { header: "Recorded", render: (p) => formatDate(p.created_at) },
          ]}
        />
      </SectionBody>
    </Panel>
  );
}

function ApplicationsSection() {
  const [filter, setFilter] = useState<FilterKey>("pending");
  const applications = useAllApplications();

  const rows = useMemo(() => {
    const all = applications.data ?? [];
    if (filter === "all") return all;
    if (filter === "pending")
      return all.filter((a) => a.status === "submitted" || a.status === "under_review");
    return all.filter((a) => a.status === filter);
  }, [applications.data, filter]);

  return (
    <Panel
      title="Partner applications"
      action={
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                filter === item.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      {applications.isLoading ? (
        <LoadingState label="Loading applications…" />
      ) : applications.isError ? (
        <ErrorState description="We couldn't load the applications right now." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing here"
          description="No applications match this filter yet."
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((application) => (
            <ApplicationRow key={application.id} application={application} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function AdminDashboard() {
  const [section, setSection] = useState<SectionKey>("overview");
  const stats = usePlatformStats();

  return (
    <DashboardShell
      title="Admin control panel"
      subtitle="Approve partners and keep an eye on NextNab activity in Latur."
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition",
              section === item.key
                ? "bg-primary text-primary-foreground shadow-brand"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "overview" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={ClipboardList}
            label="Waiting for review"
            value={stats.data?.pending ?? 0}
          />
          <StatCard icon={Users} label="Registered users" value={stats.data?.customers ?? 0} />
          <StatCard icon={Package} label="Grocery orders" value={stats.data?.orders ?? 0} />
          <StatCard icon={Wrench} label="Service bookings" value={stats.data?.bookings ?? 0} />
          <StatCard icon={Store} label="Shops on board" value={stats.data?.stores ?? 0} />
          <StatCard
            icon={BadgeCheck}
            label="Service providers"
            value={stats.data?.providers ?? 0}
          />
          <StatCard icon={Bike} label="Delivery riders" value={stats.data?.riders ?? 0} />
        </div>
      )}

      {section === "applications" && <ApplicationsSection />}
      {section === "orders" && (
        <Panel title="Orders">
          <OrdersSection />
        </Panel>
      )}
      {section === "payments" && (
        <Panel title="Payments">
          <PaymentsSection />
        </Panel>
      )}
      {section === "payouts" && <PayoutsSection />}
      {section === "stores" && (
        <Panel title="Stores">
          <StoresSection />
        </Panel>
      )}
      {section === "products" && (
        <Panel title="Products">
          <ProductsSection />
        </Panel>
      )}
      {section === "providers" && (
        <Panel title="Service providers">
          <ProvidersSection />
        </Panel>
      )}
      {section === "riders" && (
        <Panel title="Delivery riders">
          <RidersSection />
        </Panel>
      )}
      {section === "users" && (
        <Panel title="Registered users">
          <UsersSection />
        </Panel>
      )}
      {section === "reviews" && (
        <Panel title="Reviews">
          <ReviewsSection />
        </Panel>
      )}
    </DashboardShell>
  );
}

function ApplicationRow({ application }: { application: PartnerApplication }) {
  const [note, setNote] = useState("");
  const review = useReviewApplication();
  const decided = application.status === "approved" || application.status === "rejected";

  const details = [
    application.business_name ? `Shop: ${application.business_name}` : null,
    application.business_category ? `Category: ${application.business_category}` : null,
    application.service_category ? `Service: ${application.service_category}` : null,
    application.experience ? `Experience: ${application.experience}` : null,
    application.vehicle_type ? `Vehicle: ${application.vehicle_type}` : null,
    application.vehicle_number ? `Number: ${application.vehicle_number}` : null,
    application.id_type ? `ID: ${application.id_type}` : null,
    `Phone: ${application.phone}`,
    `City: ${application.city}`,
  ].filter(Boolean) as string[];

  return (
    <li className={cn(card, "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold">{application.full_name}</p>
          <p className="text-sm font-semibold text-muted-foreground">
            {TYPE_LABEL[application.partner_type] ?? application.partner_type} · applied{" "}
            {new Date(application.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold capitalize",
            STATUS_STYLE[application.status] ?? "bg-secondary text-muted-foreground",
          )}
        >
          {application.status.replace("_", " ")}
        </span>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {details.map((line) => (
          <p key={line} className="text-muted-foreground">
            {line}
          </p>
        ))}
      </dl>

      {application.review_note && (
        <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm">
          <span className="font-bold">Review note: </span>
          {application.review_note}
        </p>
      )}

      {!decided && (
        <div className="mt-5 space-y-3">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Optional note for the applicant (reason, missing document…)"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              loading={review.isPending && review.variables?.decision === "approved"}
              disabled={review.isPending}
              onClick={() => review.mutate({ id: application.id, decision: "approved", note })}
            >
              Approve partner
            </Button>
            <Button
              variant="outline"
              loading={review.isPending && review.variables?.decision === "under_review"}
              disabled={review.isPending}
              onClick={() => review.mutate({ id: application.id, decision: "under_review", note })}
            >
              Mark under review
            </Button>
            <Button
              variant="ghost"
              loading={review.isPending && review.variables?.decision === "rejected"}
              disabled={review.isPending}
              onClick={() => review.mutate({ id: application.id, decision: "rejected", note })}
            >
              Reject
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
