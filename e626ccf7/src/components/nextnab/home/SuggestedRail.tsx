import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Product, ProviderWithCategory, StoreWithCategory } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useStores } from "@/hooks/useCatalog";
import { WishlistButton } from "@/components/nextnab/WishlistButton";
import { QuantityStepper } from "@/components/nextnab/QuantityStepper";
import { ProviderCard } from "@/components/nextnab/ProviderCard";
import { StoreCard } from "@/components/nextnab/StoreCard";
import { ErrorState, LoadingState } from "@/components/nextnab/States";
import { Button } from "@/components/nextnab/Button";
import { card, container } from "@/lib/design-system";
import { distanceKm } from "@/lib/stores";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SuggestedRail({ mode }: { mode: "grocery" | "services" }) {
  return (
    <section className={`${container} pt-10`} aria-labelledby="suggested-heading">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
        Nearby favorites
      </p>
      <h2 id="suggested-heading" className="mt-1 font-display text-xl font-extrabold sm:text-2xl">
        {mode === "grocery" ? "Suggested for You" : "Trusted pros near you"}
      </h2>
      {mode === "grocery" ? <ProductRail /> : <ProviderRail />}
    </section>
  );
}

function useSuggestedProducts() {
  return useQuery({
    queryKey: ["products", "suggested"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_live", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

function ProductRail() {
  const { user } = useAuth();
  const { lines, addItem, setQuantity } = useCart();
  const products = useSuggestedProducts();

  if (products.isLoading) {
    return <LoadingState label="Loading suggestions…" className="py-10" />;
  }
  if (products.isError) {
    return (
      <ErrorState
        title="Couldn't load suggestions"
        action={<Button onClick={() => void products.refetch()}>Try again</Button>}
      />
    );
  }
  const rows = products.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        No products available yet — check back soon.
      </p>
    );
  }

  const busy = addItem.isPending || setQuantity.isPending;

  return (
    <>
      {!user && (
        <p className="mt-3 text-xs text-muted-foreground">
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign in
          </Link>{" "}
          to add items to your cart.
        </p>
      )}
      <div className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {rows.map((product) => {
          const line = lines.find((item) => item.product_id === product.id);
          return (
            <SuggestedProductCard
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
    </>
  );
}

function SuggestedProductCard({
  product,
  quantity,
  busy,
  onAdd,
  onQuantityChange,
}: {
  product: Product;
  quantity: number;
  busy: boolean;
  onAdd: () => void;
  onQuantityChange: (next: number) => void;
}) {
  const out = product.stock <= 0;

  return (
    <div className={cn(card, "relative w-40 shrink-0 p-3")}>
      <WishlistButton productId={product.id} className="absolute right-2 top-2 z-10" />
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="mx-auto block size-28 overflow-hidden rounded-full bg-secondary"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center font-display text-2xl font-bold text-muted-foreground/40">
            {product.name.slice(0, 1)}
          </span>
        )}
      </Link>
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="mt-3 line-clamp-1 block text-center font-display text-sm font-bold hover:text-primary"
      >
        {product.name}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-display text-sm font-extrabold">{inr(product.price)}</span>
        {out ? (
          <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">
            Out of stock
          </span>
        ) : quantity > 0 ? (
          <QuantityStepper quantity={quantity} onChange={onQuantityChange} disabled={busy} />
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            aria-label={`Add ${product.name} to cart`}
            className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-brand transition-colors hover:bg-brand disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function ProviderRail() {
  const providers = useQuery({
    queryKey: ["providers", "suggested"],
    queryFn: async (): Promise<ProviderWithCategory[]> => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*, category:service_categories(*)")
        .eq("is_verified", true)
        .order("rating", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as ProviderWithCategory[];
    },
  });

  if (providers.isLoading) {
    return <LoadingState label="Loading professionals…" className="py-10" />;
  }
  if (providers.isError) {
    return (
      <ErrorState
        title="Couldn't load professionals"
        action={<Button onClick={() => void providers.refetch()}>Try again</Button>}
      />
    );
  }
  const rows = providers.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="py-10 text-sm text-muted-foreground">
        No verified professionals yet — check back soon.
      </p>
    );
  }

  return (
    <div className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {rows.map((provider) => (
        <div key={provider.id} className="w-72 shrink-0">
          <ProviderCard provider={provider} />
        </div>
      ))}
    </div>
  );
}

export function ShopLocalSection() {
  const stores = useStores();
  const { reference, selected, label } = useLocation();

  const rows = useMemo(() => {
    const list = stores.data ?? [];
    return [...list].sort((a, b) => {
      const da =
        distanceKm(
          reference?.latitude ?? null,
          reference?.longitude ?? null,
          a.latitude,
          a.longitude,
        ) ?? Number.MAX_SAFE_INTEGER;
      const db =
        distanceKm(
          reference?.latitude ?? null,
          reference?.longitude ?? null,
          b.latitude,
          b.longitude,
        ) ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });
  }, [stores.data, reference]);

  return (
    <section className={`${container} py-10`} aria-labelledby="shop-local-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="shop-local-heading" className="font-display text-xl font-extrabold sm:text-2xl">
          Shop Local
        </h2>
        <p className="text-xs font-semibold text-muted-foreground">
          {stores.data?.length ?? 0} Shops Near You in {selected?.area ?? label}
        </p>
      </div>

      {stores.isLoading ? (
        <LoadingState label="Finding shops near you…" className="py-10" />
      ) : stores.isError ? (
        <ErrorState
          title="Couldn't load shops"
          action={<Button onClick={() => void stores.refetch()}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <p className="py-10 text-sm text-muted-foreground">
          No live stores yet — partner shops will appear here once approved.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {rows.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </section>
  );
}
