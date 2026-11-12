import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  ClipboardList,
  Download,
  Headphones,
  HelpCircle,
  IndianRupee,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Truck,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/nextnab/PageShell";
import { RequireRole } from "@/components/nextnab/DashboardShell";
import { StatCard } from "@/components/nextnab/StatCard";
import { Button } from "@/components/nextnab/Button";
import { Field, TextInput } from "@/components/nextnab/Form";
import { EmptyState, ErrorState, LoadingState } from "@/components/nextnab/States";
import { NotificationsBell } from "@/components/nextnab/NotificationsBell";
import { PayoutsPanel } from "@/components/nextnab/PayoutsPanel";
import { PerformanceChart } from "@/components/nextnab/PerformanceChart";
import { LiveDeliveryMap } from "@/components/nextnab/LiveDeliveryMap";
import { useProductCategories } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import {
  useAssignRider,
  useCreateProduct,
  useDeleteProduct,
  useMyStore,
  useStoreOrders,
  useStoreProducts,
  useToggleProductLive,
  useToggleStoreOnline,
  useUpdateOrderStatus,
  useUpdateProduct,
  useUpdateStoreProfile,
  useUploadProductImage,
  type ProductDraft,
  type StoreOrder,
} from "@/hooks/useDashboard";
import { dayKey, formatDate, inr, last7Days } from "@/lib/format";
import { orderPin } from "@/lib/geo";
import { card, container } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { OrderStatus, Product, ProductCategory } from "@/types";

const title = "Merchant dashboard — NextNab";
const description =
  "Manage your NextNab store: accept grocery orders, update stock and track daily earnings in Latur.";

export const Route = createFileRoute("/merchant")({
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
    <RequireRole role="shopkeeper">
      <MerchantDashboard />
    </RequireRole>
  ),
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory & Services", icon: Package },
  { id: "orders", label: "Orders & Bookings", icon: CalendarCheck },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  placed: { status: "merchant_confirmed", label: "Accept order" },
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "New",
  merchant_confirmed: "Accepted",
  partner_assigned: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const DAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PAGE_SIZE = 8;

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
      {initials(name) || <Store className="size-5" aria-hidden="true" />}
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

function Switch({
  on,
  onToggle,
  disabled,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        on ? "bg-primary" : "bg-border",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function Sidebar({ tab, onTab }: { tab: TabId; onTab: (next: TabId) => void }) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
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
          <HelpCircle className="size-4 text-primary" aria-hidden="true" /> Help Center
        </p>
        <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold">
          <Headphones className="size-4 text-primary" aria-hidden="true" /> Support
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Guides and the Latur partner team, whenever you need them.
        </p>
        <Link
          to="/help"
          className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
        >
          Open help center
        </Link>
      </div>
    </div>
  );
}

function InvStat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  tone: "brand" | "mint" | "plain" | "danger";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 shadow-card",
        tone === "brand" && "bg-accent",
        tone === "mint" && "bg-[#d9f2e4]",
        tone === "plain" && "bg-secondary",
        tone === "danger" && "bg-destructive/10",
      )}
    >
      <span
        className={cn(
          "absolute right-4 top-4 grid size-9 place-items-center rounded-full",
          tone === "danger" ? "bg-destructive/15 text-destructive" : "bg-card text-primary",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-extrabold",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function StockLevel({ stock }: { stock: number }) {
  const tone = stock === 0 ? "out" : stock <= 10 ? "low" : "in";
  const pct = Math.max(4, Math.min(100, Math.round((stock / 60) * 100)));
  return (
    <div>
      <p
        className={cn(
          "text-xs font-bold",
          tone === "out"
            ? "text-destructive"
            : tone === "low"
              ? "text-[#b45309]"
              : "text-[#006c49]",
        )}
      >
        {tone === "out" ? "Out of Stock" : tone === "low" ? "Low Stock" : "In Stock"}
      </p>
      <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-secondary">
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "out" ? "bg-destructive" : tone === "low" ? "bg-[#b45309]" : "bg-[#006c49]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{stock} units</p>
    </div>
  );
}

function OrderRow({
  order,
  origin,
}: {
  order: StoreOrder;
  origin: { lat: number; lng: number } | null;
}) {
  const update = useUpdateOrderStatus();
  const assign = useAssignRider();
  const next = NEXT_STATUS[order.status];
  const canAssign = order.status === "merchant_confirmed";

  return (
    <li className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-extrabold">#{order.order_number}</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              order.status === "delivered"
                ? "bg-primary/15 text-primary"
                : order.status === "cancelled"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent text-primary",
            )}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {order.order_items.length} item{order.order_items.length === 1 ? "" : "s"} ·{" "}
          {formatDate(order.placed_at)} · {inr(order.total)}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {order.order_items.map((item) => `${item.product_name} × ${item.quantity}`).join(", ")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {order.status === "placed" && (
          <Button
            size="sm"
            variant="ghost"
            loading={update.isPending}
            onClick={() => update.mutate({ id: order.id, status: "cancelled" })}
          >
            Reject
          </Button>
        )}
        {next && (
          <Button
            size="sm"
            loading={update.isPending}
            onClick={() => update.mutate({ id: order.id, status: next.status })}
          >
            {next.label}
          </Button>
        )}
        {canAssign && (
          <Button
            size="sm"
            loading={assign.isPending}
            onClick={() => assign.mutate({ orderId: order.id })}
          >
            Ready for pickup
          </Button>
        )}
      </div>
      {order.status === "out_for_delivery" && (
        <div className="sm:col-span-2">
          <LiveDeliveryMap orderId={order.id} origin={origin} destination={orderPin(order)} />
        </div>
      )}
    </li>
  );
}

function ProductForm({
  storeId,
  categories,
  product,
  onDone,
}: {
  storeId: string;
  categories: ProductCategory[];
  product?: Product;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const upload = useUploadProductImage();

  const [name, setName] = useState(product?.name ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "1 pc");
  const [mrp, setMrp] = useState(product ? String(product.mrp) : "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [shortDescription, setShortDescription] = useState(product?.short_description ?? "");

  const busy = create.isPending || update.isPending || upload.isPending;

  async function handleImage(file: File | undefined) {
    if (!file || !user) return;
    const url = await upload.mutateAsync({ userId: user.id, file });
    setImageUrl(url);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedMrp = Number(mrp);
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (!name.trim()) return;
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return;
    if (!Number.isFinite(parsedMrp) || parsedMrp < 0) return;
    if (!Number.isFinite(parsedStock) || parsedStock < 0) return;

    const draft: ProductDraft = {
      store_id: storeId,
      name: name.trim(),
      unit: unit.trim() || "1 pc",
      mrp: parsedMrp || parsedPrice,
      price: parsedPrice,
      stock: Math.round(parsedStock),
      category_id: categoryId || null,
      image_url: imageUrl || null,
      short_description: shortDescription.trim() || null,
    };

    if (product) {
      const { store_id: _ignored, ...patch } = draft;
      update.mutate({ id: product.id, patch }, { onSuccess: onDone });
    } else {
      create.mutate(draft, { onSuccess: onDone });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 space-y-4 rounded-2xl border border-brand/40 bg-surface-low p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-extrabold">
          {product ? `Edit ${product.name}` : "Add a product"}
        </h3>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close product form"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Tomato" />
        </Field>
        <Field label="Unit">
          <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="500 g" />
        </Field>
        <Field label="MRP (₹)" required>
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            placeholder="40"
          />
        </Field>
        <Field label="Selling price (₹)" required>
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="32"
          />
        </Field>
        <Field label="Stock" required>
          <TextInput
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </Field>
        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-12 w-full rounded-2xl border border-border bg-surface-low px-4 text-sm outline-none focus:border-brand focus:bg-card"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Short description">
        <TextInput
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Farm-fresh local tomatoes"
        />
      </Field>

      <Field label="Product image" hint="Upload a photo, or paste an image URL below.">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            disabled={!user || upload.isPending}
            onChange={(e) => void handleImage(e.target.files?.[0])}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
          />
          {upload.isPending && <span className="text-xs text-muted-foreground">Uploading…</span>}
        </div>
      </Field>
      <TextInput
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="https://…"
      />

      <div className="flex gap-3">
        <Button type="submit" loading={busy}>
          {product ? "Save changes" : "Add product"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ProductRow({
  product,
  categories,
  storeId,
}: {
  product: Product;
  categories: ProductCategory[];
  storeId: string;
}) {
  const toggle = useToggleProductLive();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(String(product.stock));
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <li className="py-4">
        <ProductForm
          storeId={storeId}
          categories={categories}
          product={product}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  function commitStock() {
    const next = Number(stock);
    if (!Number.isFinite(next) || next < 0) {
      setStock(String(product.stock));
      return;
    }
    const value = Math.round(next);
    if (value === product.stock) return;
    update.mutate({ id: product.id, patch: { stock: value } });
  }

  const categoryName = product.category_id
    ? (categories.find((c) => c.id === product.category_id)?.name ?? "—")
    : "—";

  return (
    <li className="grid gap-3 border-b border-border py-4 last:border-0 md:grid-cols-[minmax(0,2.2fr)_1fr_auto_minmax(0,1.3fr)_auto_auto] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="size-11 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <Package className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{product.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            SKU: {product.sku ?? product.id.slice(0, 8).toUpperCase()} · {product.unit}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{categoryName}</p>

      <p className="text-sm font-bold">{inr(product.price)}</p>

      <StockLevel stock={product.stock} />

      <span
        className={cn(
          "justify-self-start rounded-full px-3 py-1 text-xs font-bold md:justify-self-auto",
          product.is_live ? "bg-[#d9f2e4] text-[#006c49]" : "bg-secondary text-muted-foreground",
        )}
      >
        {product.is_live ? "Live" : "Hidden"}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          Stock
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={commitStock}
            disabled={update.isPending}
            className="h-9 w-20 rounded-xl border border-border bg-surface-low px-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <Button
          size="sm"
          variant={product.is_live ? "outline" : "primary"}
          loading={toggle.isPending}
          onClick={() => toggle.mutate({ id: product.id, isLive: !product.is_live })}
        >
          {product.is_live ? "Hide" : "Publish"}
        </Button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
          aria-label={`Edit ${product.name}`}
        >
          <Pencil className="size-4" />
        </button>
        {confirmDelete ? (
          <span className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              loading={remove.isPending}
              onClick={() => remove.mutate({ id: product.id })}
            >
              Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
              No
            </Button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}

function exportCsv(products: Product[], categories: ProductCategory[]) {
  const header = ["name", "sku", "unit", "category", "price", "mrp", "stock", "status"];
  const rows = products.map((product) => [
    product.name,
    product.sku ?? "",
    product.unit,
    categories.find((c) => c.id === product.category_id)?.name ?? "",
    String(product.price),
    String(product.mrp),
    String(product.stock),
    product.is_live ? "live" : "hidden",
  ]);
  const csv = [header, ...rows]
    .map((cols) => cols.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "nextnab-inventory.csv";
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("Inventory exported as CSV");
}

function BulkUploadButton({ storeId }: { storeId: string }) {
  const create = useCreateProduct();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.error("That CSV is empty");
      return;
    }
    const rows = (lines[0] ?? "").toLowerCase().includes("name") ? lines.slice(1) : lines;
    let imported = 0;
    let skipped = 0;
    for (const line of rows) {
      const [name, unit, mrp, price, stock] = line.split(",").map((cell) => cell.trim());
      const parsedPrice = Number(price);
      const parsedMrp = Number(mrp);
      const parsedStock = Number(stock);
      if (!name || !Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock)) {
        skipped += 1;
        continue;
      }
      try {
        await create.mutateAsync({
          store_id: storeId,
          name,
          unit: unit || "1 pc",
          mrp: Number.isFinite(parsedMrp) && parsedMrp > 0 ? parsedMrp : parsedPrice,
          price: parsedPrice,
          stock: Math.round(parsedStock),
          category_id: null,
          image_url: null,
          short_description: null,
        });
        imported += 1;
      } catch {
        skipped += 1;
      }
    }
    toast.success(
      `Imported ${imported} product${imported === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}`,
    );
  }

  return (
    <label className="inline-flex">
      <span className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold transition-all duration-200 hover:border-brand hover:text-primary">
        <UploadCloud className="size-4" aria-hidden="true" />
        {create.isPending ? "Importing…" : "Bulk Upload"}
      </span>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function StoreProfileForm({ storeId }: { storeId: string }) {
  const store = useMyStore();
  const save = useUpdateStoreProfile();
  const shop = store.data;

  const [name, setName] = useState(shop?.name ?? "");
  const [opening, setOpening] = useState(shop?.opening_time ?? "");
  const [closing, setClosing] = useState(shop?.closing_time ?? "");
  const [days, setDays] = useState<string[]>(shop?.open_days ?? []);
  const [address, setAddress] = useState(shop?.address ?? "");
  const [city, setCity] = useState(shop?.city ?? "Latur");
  const [minOrder, setMinOrder] = useState(
    shop?.min_order_value != null ? String(shop.min_order_value) : "",
  );
  const [packaging, setPackaging] = useState(
    shop?.packaging_charge != null ? String(shop.packaging_charge) : "",
  );
  const [loaded, setLoaded] = useState(false);

  if (shop && !loaded) {
    setName(shop.name);
    setOpening(shop.opening_time ?? "");
    setClosing(shop.closing_time ?? "");
    setDays(shop.open_days ?? []);
    setAddress(shop.address ?? "");
    setCity(shop.city ?? "Latur");
    setMinOrder(shop.min_order_value != null ? String(shop.min_order_value) : "");
    setPackaging(shop.packaging_charge != null ? String(shop.packaging_charge) : "");
    setLoaded(true);
  }

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!shop) return;
    save.mutate({
      id: storeId,
      patch: {
        name: name.trim() || shop.name,
        opening_time: opening || null,
        closing_time: closing || null,
        open_days: days,
        address: address.trim() || null,
        city: city.trim() || "Latur",
        min_order_value: minOrder === "" ? null : Number(minOrder),
        packaging_charge: packaging === "" ? null : Number(packaging),
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Store name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="City">
          <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="Opens at">
          <TextInput type="time" value={opening} onChange={(e) => setOpening(e.target.value)} />
        </Field>
        <Field label="Closes at">
          <TextInput type="time" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </Field>
        <Field label="Minimum order (₹)">
          <TextInput
            type="number"
            min="0"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Packaging charge (₹)">
          <TextInput
            type="number"
            min="0"
            value={packaging}
            onChange={(e) => setPackaging(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <Field label="Address">
        <TextInput value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-semibold">Open days</span>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => {
            const active = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" loading={save.isPending}>
        Save store profile
      </Button>
    </form>
  );
}

function MerchantDashboard() {
  const store = useMyStore();
  const storeId = store.data?.id;
  const products = useStoreProducts(storeId);
  const orders = useStoreOrders(storeId);
  const categories = useProductCategories();
  const toggleStore = useToggleStoreOnline();
  const [tab, setTab] = useState<TabId>("overview");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  if (store.isLoading) {
    return (
      <PageShell>
        <div className={cn(container, "py-24")}>
          <LoadingState label="Loading your store…" />
        </div>
      </PageShell>
    );
  }

  if (store.isError) {
    return (
      <PageShell>
        <div className={cn(container, "py-24")}>
          <ErrorState action={<Button onClick={() => void store.refetch()}>Try again</Button>} />
        </div>
      </PageShell>
    );
  }

  if (!store.data) {
    return (
      <PageShell>
        <div className={cn(container, "py-24")}>
          <EmptyState
            icon={Store}
            title="No store linked yet"
            description="Your shopkeeper account is approved but no store is linked. Our Latur team will set up your store shortly."
            action={
              <Link to="/partner/status">
                <Button>Check application status</Button>
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  const shop = store.data;
  const orderList = orders.data ?? [];
  const productList = products.data ?? [];
  const categoryList = categories.data ?? [];
  const todayKey = dayKey(new Date().toISOString());
  const yesterdayKey = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const todayOrders = orderList.filter(
    (order) => order.status !== "cancelled" && dayKey(order.placed_at) === todayKey,
  );
  const yesterdayOrders = orderList.filter(
    (order) => order.status !== "cancelled" && dayKey(order.placed_at) === yesterdayKey,
  );
  const revenueOn = (list: typeof orderList) =>
    list
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + Number(order.total), 0);
  const todayRevenue = revenueOn(todayOrders);
  const yesterdayRevenue = revenueOn(yesterdayOrders);
  const revenueDelta =
    yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : todayRevenue > 0
        ? 100
        : 0;
  const newOrders = orderList.filter((order) => order.status === "placed");
  const activeDeliveries = orderList.filter(
    (order) => order.status === "partner_assigned" || order.status === "out_for_delivery",
  );
  const outOfStock = productList.filter((product) => product.stock === 0);
  const lowStock = productList
    .filter((product) => product.stock > 0 && product.stock <= 10)
    .sort((a, b) => a.stock - b.stock);
  const totalRevenue = revenueOn(orderList);

  const trimmedQuery = query.trim().toLowerCase();
  const visibleProducts = productList
    .filter((product) => (categoryFilter ? product.category_id === categoryFilter : true))
    .filter((product) => (trimmedQuery ? product.name.toLowerCase().includes(trimmedQuery) : true))
    .sort((a, b) => a.name.localeCompare(b.name));
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageProducts = visibleProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const performance = last7Days().map((day) => {
    const dayOrders = orderList.filter(
      (order) => order.status !== "cancelled" && dayKey(order.placed_at) === day.key,
    );
    return {
      day: day.label,
      value: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
      count: dayOrders.length,
    };
  });

  const origin =
    shop.latitude != null && shop.longitude != null
      ? { lat: shop.latitude, lng: shop.longitude }
      : null;

  return (
    <PageShell>
      <div className={cn(container, "py-6 lg:py-8")}>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={shop.name} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">
                {shop.name}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                  <span className="size-1.5 rounded-full bg-primary" /> Live in {shop.city}
                </span>
                Merchant ID: #{shop.slug ?? shop.id.slice(0, 4)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <OnlinePill
              online={shop.is_online}
              busy={toggleStore.isPending}
              onToggle={() => toggleStore.mutate({ id: shop.id, isOnline: !shop.is_online })}
            />
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Sidebar tab={tab} onTab={setTab} />

          <div className="min-w-0 space-y-6">
            {tab === "overview" && (
              <>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Welcome back, {shop.name.split(" ")[0]}
                    </h1>
                    <p className="mt-1 inline-flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <Store className="size-4" aria-hidden="true" /> Verified Retail Partner
                      </span>
                      <span>•</span>
                      <span>
                        {shop.opening_time ?? "—"} – {shop.closing_time ?? "—"} ·{" "}
                        {shop.open_days.length} days a week
                      </span>
                    </p>
                  </div>
                  <div className={cn(card, "flex items-center gap-3 p-4")}>
                    <Switch
                      on={shop.is_online}
                      disabled={toggleStore.isPending}
                      label="Accepting new orders"
                      onToggle={() =>
                        toggleStore.mutate({ id: shop.id, isOnline: !shop.is_online })
                      }
                    />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        Global store status
                      </p>
                      <p className="text-sm font-semibold">
                        {shop.is_online ? "Accepting new orders" : "Store paused"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <InvStat
                    icon={ClipboardList}
                    label="New orders"
                    value={newOrders.length}
                    hint="waiting for your accept"
                    tone="brand"
                  />
                  <InvStat
                    icon={IndianRupee}
                    label="Today's revenue"
                    value={inr(todayRevenue)}
                    hint={`${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% vs yesterday`}
                    tone="mint"
                  />
                  <InvStat
                    icon={Truck}
                    label="Active deliveries"
                    value={activeDeliveries.length}
                    hint="ready or out for delivery"
                    tone="plain"
                  />
                  <InvStat
                    icon={TriangleAlert}
                    label="Out of stock"
                    value={outOfStock.length}
                    hint="items require attention"
                    tone="danger"
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <section className={cn(card, "p-5")}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-display text-lg font-extrabold">Recent orders</h2>
                      <Button size="sm" variant="outline" onClick={() => setTab("orders")}>
                        View all
                      </Button>
                    </div>
                    {orderList.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No orders yet. They&apos;ll appear here live.
                      </p>
                    ) : (
                      <ul className="mt-4 grid gap-3">
                        {orderList.slice(0, 4).map((order) => (
                          <OrderRow key={order.id} order={order} origin={origin} />
                        ))}
                      </ul>
                    )}
                  </section>

                  <div className="space-y-6">
                    <section className={cn(card, "p-5")}>
                      <h2 className="font-display text-lg font-extrabold">Stock alerts</h2>
                      {outOfStock.length === 0 && lowStock.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Stock looks healthy across your catalogue.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {[...outOfStock, ...lowStock].slice(0, 6).map((product) => (
                            <li
                              key={product.id}
                              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-low px-3 py-2"
                            >
                              <span className="min-w-0 truncate text-sm font-semibold">
                                {product.name}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                                  product.stock === 0
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-[#fef3c7] text-[#b45309]",
                                )}
                              >
                                {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => setTab("inventory")}
                      >
                        Manage inventory
                      </Button>
                    </section>

                    <section className={cn(card, "p-5")}>
                      <h2 className="font-display text-lg font-extrabold">Store snapshot</h2>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Products live</dt>
                          <dd className="font-bold">
                            {productList.filter((p) => p.is_live).length} / {productList.length}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Minimum order</dt>
                          <dd className="font-bold">
                            {shop.min_order_value != null ? inr(shop.min_order_value) : "None"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Packaging charge</dt>
                          <dd className="font-bold">
                            {shop.packaging_charge != null ? inr(shop.packaging_charge) : "None"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">All-time revenue</dt>
                          <dd className="font-bold">{inr(totalRevenue)}</dd>
                        </div>
                      </dl>
                    </section>
                  </div>
                </div>
              </>
            )}

            {tab === "inventory" && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Inventory Management
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Manage your products, track stock, and update pricing.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BulkUploadButton storeId={shop.id} />
                    <Button
                      variant="outline"
                      onClick={() => exportCsv(productList, categoryList)}
                      disabled={productList.length === 0}
                    >
                      <Download className="size-4" aria-hidden="true" /> Export
                    </Button>
                    <Button onClick={() => setAdding((v) => !v)}>
                      <Plus className="size-4" aria-hidden="true" />
                      {adding ? "Close" : "Add New Product"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <InvStat
                    icon={ClipboardList}
                    label="Today's orders"
                    value={todayOrders.length}
                    hint={`${todayOrders.length} placed today`}
                    tone="brand"
                  />
                  <InvStat
                    icon={IndianRupee}
                    label="Revenue (today)"
                    value={inr(todayRevenue)}
                    hint={`${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% vs yesterday`}
                    tone="mint"
                  />
                  <InvStat
                    icon={Truck}
                    label="Pending deliveries"
                    value={activeDeliveries.length}
                    hint="ready for pickup"
                    tone="plain"
                  />
                  <InvStat
                    icon={TriangleAlert}
                    label="Out of stock"
                    value={outOfStock.length}
                    hint="items require attention"
                    tone="danger"
                  />
                </div>

                <section className={cn(card, "p-5")}>
                  {adding && (
                    <ProductForm
                      storeId={shop.id}
                      categories={categoryList}
                      onDone={() => setAdding(false)}
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="relative min-w-48 flex-1">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <input
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setPage(1);
                        }}
                        placeholder="Search products, categories…"
                        className="h-10 w-full rounded-full border border-border bg-surface-low pl-9 pr-3 text-sm outline-none focus:border-brand"
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter("");
                          setPage(1);
                        }}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-bold transition",
                          categoryFilter === ""
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground",
                        )}
                      >
                        All Items ({productList.length})
                      </button>
                      {categoryList.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat.id === categoryFilter ? "" : cat.id);
                            setPage(1);
                          }}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-bold transition",
                            categoryFilter === cat.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {products.isLoading ? (
                    <LoadingState label="Loading products…" />
                  ) : productList.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No products yet. Add your first product to start selling.
                    </p>
                  ) : visibleProducts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No products match your search or filters.
                    </p>
                  ) : (
                    <>
                      <div className="mt-4 hidden gap-3 border-b border-border pb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,2.2fr)_1fr_auto_minmax(0,1.3fr)_auto_auto]">
                        <span>Product details</span>
                        <span>Category</span>
                        <span>Price</span>
                        <span>Stock level</span>
                        <span>Status</span>
                        <span>Actions</span>
                      </div>
                      <ul>
                        {pageProducts.map((product) => (
                          <ProductRow
                            key={product.id}
                            product={product}
                            categories={categoryList}
                            storeId={shop.id}
                          />
                        ))}
                      </ul>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <p>
                          Showing {(safePage - 1) * PAGE_SIZE + 1}–
                          {Math.min(safePage * PAGE_SIZE, visibleProducts.length)} of{" "}
                          {visibleProducts.length} products
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={safePage === 1}
                            onClick={() => setPage(safePage - 1)}
                          >
                            Previous
                          </Button>
                          {Array.from({ length: pageCount }, (_, index) => index + 1).map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setPage(num)}
                              className={cn(
                                "size-8 rounded-full text-xs font-bold transition",
                                num === safePage
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                              )}
                            >
                              {num}
                            </button>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={safePage === pageCount}
                            onClick={() => setPage(safePage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </section>
              </>
            )}

            {tab === "orders" && (
              <section className={cn(card, "p-5")}>
                <h1 className="font-display text-xl font-extrabold">Orders &amp; Bookings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {newOrders.length} new · {activeDeliveries.length} in delivery ·{" "}
                  {orderList.filter((o) => o.status === "delivered").length} delivered
                </p>
                {orders.isLoading ? (
                  <LoadingState label="Loading orders…" />
                ) : orderList.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No orders yet. They&apos;ll appear here live.
                  </p>
                ) : (
                  <ul className="mt-4 grid gap-3">
                    {orderList.map((order) => (
                      <OrderRow key={order.id} order={order} origin={origin} />
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === "performance" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    icon={IndianRupee}
                    label="Delivered revenue"
                    value={inr(totalRevenue)}
                  />
                  <StatCard icon={ShoppingBag} label="Total orders" value={orderList.length} />
                  <StatCard
                    icon={ClipboardList}
                    label="Avg order value"
                    value={inr(
                      orderList.length > 0
                        ? Math.round(
                            orderList.reduce((sum, order) => sum + Number(order.total), 0) /
                              orderList.length,
                          )
                        : 0,
                    )}
                  />
                </div>
                <PerformanceChart title="Revenue — last 7 days" data={performance} isMoney />
              </>
            )}

            {tab === "payouts" && <PayoutsPanel partnerId={shop.id} />}

            {tab === "settings" && (
              <section className={cn(card, "p-5")}>
                <h1 className="font-display text-xl font-extrabold">Store profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hours, delivery rules and contact details customers see.
                </p>
                <div className="mt-5">
                  <StoreProfileForm storeId={shop.id} />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
