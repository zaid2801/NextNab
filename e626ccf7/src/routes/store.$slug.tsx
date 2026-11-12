import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Search, Star, Store as StoreIcon } from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { ProductCard } from "@/components/nextnab/ProductCard";
import { Button } from "@/components/nextnab/Button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ProductSkeletonGrid,
} from "@/components/nextnab/States";
import { useStore, useStoreProductsLive } from "@/hooks/useCatalog";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/hooks/useLocation";
import { card, container } from "@/lib/design-system";
import { distanceKm, formatKm, isStoreOpen } from "@/lib/stores";
import { cn } from "@/lib/utils";

const title = "Store — NextNab Latur";
const description = "Browse products from local Latur stores and add them to your NextNab cart.";

export const Route = createFileRoute("/store/$slug")({
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
  component: StorePage,
});

function StorePage() {
  const { slug } = Route.useParams();
  const store = useStore(slug);
  const { reference } = useLocation();
  const [search, setSearch] = useState("");
  const products = useStoreProductsLive(store.data?.id, search || undefined);
  const { lines, addItem, setQuantity } = useCart();
  const busy = addItem.isPending || setQuantity.isPending;

  if (store.isLoading) {
    return (
      <PageShell>
        <LoadingState label="Loading store…" />
      </PageShell>
    );
  }
  if (store.isError) {
    return (
      <PageShell>
        <div className={`${container} py-20`}>
          <ErrorState
            title="Couldn't load this store"
            action={<Button onClick={() => void store.refetch()}>Try again</Button>}
          />
        </div>
      </PageShell>
    );
  }
  const shop = store.data;
  if (!shop) {
    return (
      <PageShell>
        <div className={`${container} py-20`}>
          <EmptyState
            icon={StoreIcon}
            title="Store not found"
            description="This store may have been renamed or is no longer live on NextNab."
            action={
              <Link to="/">
                <Button>Back to home</Button>
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  const open = isStoreOpen(shop);
  const km = distanceKm(
    reference?.latitude ?? null,
    reference?.longitude ?? null,
    shop.latitude,
    shop.longitude,
  );
  const rows = products.data ?? [];

  return (
    <PageShell>
      <div className={`${container} py-8`}>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
        </Link>

        <header className={cn(card, "mt-4 overflow-hidden")}>
          <div className="h-28 bg-gradient-to-r from-primary to-brand sm:h-32" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="-mt-14 size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-secondary sm:-mt-16">
              {shop.image_url ? (
                <img src={shop.image_url} alt={shop.name} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-primary">
                  <StoreIcon className="size-8" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight">{shop.name}</h1>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
                    open ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {open ? "OPEN" : "CLOSED"}
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {Number(shop.rating ?? 0).toFixed(1)}
                </span>
                {km != null && <span>{formatKm(km)} away</span>}
                <span>{shop.category?.name ?? "Grocery & Essentials"}</span>
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                {shop.opening_time ?? "--:--"} – {shop.closing_time ?? "--:--"}
                {shop.address ? ` · ${shop.address}` : ""}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8" aria-labelledby="store-products-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="store-products-heading" className="font-display text-xl font-extrabold">
              Products
            </h2>
            <div className="relative w-full max-w-xs">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter products in this store"
                aria-label="Filter products in this store"
                className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand"
              />
            </div>
          </div>

          {products.isLoading ? (
            <div className="mt-5">
              <ProductSkeletonGrid count={5} />
            </div>
          ) : products.isError ? (
            <div className="mt-5">
              <ErrorState
                title="Couldn't load products"
                action={<Button onClick={() => void products.refetch()}>Try again</Button>}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={Search}
                title="No products here yet"
                description={
                  search
                    ? `Nothing in this store matches “${search}”.`
                    : "This store hasn't published products yet."
                }
              />
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {rows.map((product) => {
                const line = lines.find((item) => item.product_id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={line?.quantity ?? 0}
                    busy={busy}
                    onAdd={() => addItem.mutate({ productId: product.id })}
                    onQuantityChange={(next) =>
                      line && setQuantity.mutate({ itemId: line.id, quantity: next })
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
