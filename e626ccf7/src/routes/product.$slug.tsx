import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  Tag,
  Timer,
  Zap,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { ProductCard } from "@/components/nextnab/ProductCard";
import { Button } from "@/components/nextnab/Button";
import { WishlistButton } from "@/components/nextnab/WishlistButton";
import { ErrorState, LoadingState } from "@/components/nextnab/States";
import { useProduct, useProductCategories, useProducts } from "@/hooks/useCatalog";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/hooks/useLocation";
import { container } from "@/lib/design-system";
import { discountPercent, inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [
      { title: "Product — NextNab Latur" },
      {
        name: "description",
        content: "Product details, price and delivery information on NextNab Latur.",
      },
      { property: "og:title", content: "Product — NextNab Latur" },
      {
        property: "og:description",
        content: "Product details, price and delivery information on NextNab Latur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading, isError, refetch } = useProduct(slug);

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState label="Loading product…" className="py-32" />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <ErrorState
          title="Couldn't load this product"
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <div className={`${container} py-24 text-center`}>
          <h1 className="font-display text-2xl font-extrabold">Product not found</h1>
          <Link to="/groceries" className="mt-4 inline-block">
            <Button>Back to groceries</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  return <ProductDetail key={product.id} slug={slug} />;
}

function ProductDetail({ slug }: { slug: string }) {
  const { data: product } = useProduct(slug);
  const { data: categories = [] } = useProductCategories();
  const { data: allProducts = [] } = useProducts();
  const { lines, addItem, setQuantity } = useCart();
  const { label } = useLocation();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "info">("description");

  if (!product) return null;

  const line = lines.find((item) => item.product_id === product.id);
  const off = discountPercent(product.mrp, product.price);
  const category = categories.find((cat) => cat.id === product.category_id);
  const inCart = line?.quantity ?? 0;

  const related = allProducts
    .filter((row) => row.id !== product.id)
    .sort((a, b) => {
      const aSame = a.category_id === product.category_id ? 0 : 1;
      const bSame = b.category_id === product.category_id ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, 4);

  const busy = addItem.isPending || setQuantity.isPending;

  return (
    <PageShell>
      <div className={`${container} py-8`}>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
          <Link to="/groceries" className="font-semibold text-muted-foreground hover:text-primary">
            Groceries
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-semibold text-muted-foreground">
            {category?.name ?? "All products"}
          </span>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-semibold text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="relative rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
              {off > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-brand">
                  {off}% OFF
                </span>
              )}
              <WishlistButton productId={product.id} className="absolute right-4 top-4 z-10" />
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="aspect-square w-full rounded-2xl bg-secondary object-cover"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center rounded-2xl bg-secondary font-display text-7xl font-bold text-muted-foreground/40">
                  {product.name.slice(0, 1)}
                </div>
              )}
            </div>
            {product.image_url && (
              <div className="mt-4 flex gap-3">
                <span className="grid size-20 place-items-center overflow-hidden rounded-xl border-2 border-primary bg-card p-1">
                  <img
                    src={product.image_url}
                    alt=""
                    className="size-full rounded-lg object-cover"
                  />
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {product.brand ?? "NextNab Essentials"}
            </p>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{product.unit}</p>

            <div className="mt-4 flex items-center gap-3">
              <span className="font-display text-2xl font-extrabold">{inr(product.price)}</span>
              {off > 0 && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {inr(product.mrp)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#6ffbbe] px-3 py-1 text-xs font-bold text-[#00432b]">
                    <Tag className="size-3" aria-hidden="true" /> {off}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-secondary p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
                <Zap className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold">Get it in 20 mins</p>
                <p className="text-xs text-muted-foreground">Delivery to {label}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="inline-flex items-center justify-between rounded-full border border-border bg-card px-2 py-1.5">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="min-w-8 text-center font-display text-sm font-bold">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= product.stock}
                  onClick={() => setQty((value) => Math.min(product.stock, value + 1))}
                  className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>

              {product.stock <= 0 ? (
                <span className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
                  Out of stock
                </span>
              ) : inCart > 0 ? (
                <div className="flex flex-1 items-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    loading={busy}
                    onClick={() =>
                      line && setQuantity.mutate({ itemId: line.id, quantity: inCart + qty })
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" /> Add {qty} more
                  </Button>
                  <Link to="/cart">
                    <Button size="lg">
                      <ShoppingCart className="size-4" aria-hidden="true" /> Go to cart
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="flex-1"
                  loading={busy}
                  onClick={() => addItem.mutate({ productId: product.id, quantity: qty })}
                >
                  <ShoppingCart className="size-4" aria-hidden="true" /> Add to Cart
                </Button>
              )}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 text-center">
              <TrustItem icon={Timer} label="20-Min Delivery" />
              <TrustItem icon={BadgeCheck} label="Freshness Guarantee" />
              <TrustItem icon={RotateCcw} label="Easy Returns" />
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="grid grid-cols-2">
            <TabButton active={tab === "description"} onClick={() => setTab("description")}>
              Description
            </TabButton>
            <TabButton active={tab === "info"} onClick={() => setTab("info")}>
              Product Info
            </TabButton>
          </div>
          <div className="space-y-3 border-t border-border p-6 text-sm text-muted-foreground">
            {tab === "description" ? (
              <>
                <p>{product.short_description || product.description || "No description yet."}</p>
                {product.short_description && product.description && <p>{product.description}</p>}
              </>
            ) : (
              <dl className="space-y-2">
                <InfoRow label="Unit" value={product.unit} />
                {product.shelf_life && <InfoRow label="Shelf life" value={product.shelf_life} />}
                {product.storage_info && <InfoRow label="Storage" value={product.storage_info} />}
                {product.fssai_license && (
                  <InfoRow label="FSSAI license" value={product.fssai_license} />
                )}
                <InfoRow label="Availability" value={`${product.stock} in stock`} />
              </dl>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-display text-xl font-extrabold sm:text-2xl">
              Customers also bought
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((row) => {
                const relatedLine = lines.find((item) => item.product_id === row.id);
                return (
                  <ProductCard
                    key={row.id}
                    product={row}
                    quantity={relatedLine?.quantity ?? 0}
                    busy={busy}
                    onAdd={() => addItem.mutate({ productId: row.id })}
                    onQuantityChange={(next) =>
                      relatedLine && setQuantity.mutate({ itemId: relatedLine.id, quantity: next })
                    }
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function TrustItem({ icon: Icon, label }: { icon: typeof Timer; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Icon className="size-6 text-primary" aria-hidden="true" />
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "py-3.5 text-sm font-bold transition-colors",
        active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
