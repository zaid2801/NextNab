import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Wrench } from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { ProductCard } from "@/components/nextnab/ProductCard";
import { StoreCard } from "@/components/nextnab/StoreCard";
import { ProviderCard } from "@/components/nextnab/ProviderCard";
import { Button } from "@/components/nextnab/Button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ProductSkeletonGrid,
} from "@/components/nextnab/States";
import { ModeSwitch, type HomeMode } from "@/components/nextnab/home/ModeSwitch";
import { useProducts, useProviders, useServices, useStores } from "@/hooks/useCatalog";
import { useCart } from "@/hooks/useCart";
import { container } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const title = "Search — NextNab Latur";
const description =
  "Search grocery products, local stores, home services and professionals in Latur.";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    mode: search["mode"] === "services" ? ("services" as const) : ("grocery" as const),
  }),
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
  component: SearchPage,
});

function SearchPage() {
  const { q, mode } = Route.useSearch();
  const navigate = Route.useNavigate();
  const term = q.trim();

  return (
    <PageShell>
      <div className={`${container} py-8`}>
        <div className="max-w-md">
          <ModeSwitch
            mode={mode}
            onChange={(next: HomeMode) =>
              void navigate({ to: "/search", search: { q, mode: next } })
            }
          />
        </div>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const value = String(new FormData(event.currentTarget).get("q") ?? "");
            void navigate({ to: "/search", search: { q: value, mode } });
          }}
          className="relative mt-4 max-w-xl"
        >
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary"
            aria-hidden="true"
          />
          <input
            name="q"
            defaultValue={q}
            key={q}
            placeholder={mode === "grocery" ? "Search shops or items" : "Search services or pros"}
            aria-label="Search"
            className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 text-sm shadow-soft outline-none transition-colors focus:border-brand"
          />
        </form>

        {term === "" ? (
          <EmptyState
            icon={Search}
            title="Search NextNab"
            description={
              mode === "grocery"
                ? "Find products by name or discover local stores near you."
                : "Find home services and verified professionals by name."
            }
          />
        ) : mode === "grocery" ? (
          <GroceryResults term={term} />
        ) : (
          <ServiceResults term={term} />
        )}
      </div>
    </PageShell>
  );
}

function GroceryResults({ term }: { term: string }) {
  const products = useProducts(undefined, term);
  const stores = useStores();
  const { lines, addItem, setQuantity } = useCart();
  const busy = addItem.isPending || setQuantity.isPending;

  const matchedStores = (stores.data ?? []).filter((store) =>
    store.name.toLowerCase().includes(term.toLowerCase()),
  );
  const rows = products.data ?? [];

  if (products.isLoading || stores.isLoading) {
    return (
      <div className="mt-8">
        <ProductSkeletonGrid count={6} />
      </div>
    );
  }
  if (products.isError || stores.isError) {
    return (
      <div className="mt-8">
        <ErrorState
          title="Search failed"
          action={
            <Button
              onClick={() => {
                void products.refetch();
                void stores.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      </div>
    );
  }
  if (rows.length === 0 && matchedStores.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={Search}
          title={`No results for “${term}”`}
          description="Check the spelling or try a different keyword."
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {matchedStores.length > 0 && (
        <section aria-label="Stores">
          <h2 className="font-display text-lg font-extrabold">Stores</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {matchedStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}
      <section aria-label="Products">
        <h2 className="font-display text-lg font-extrabold">
          Products{" "}
          {rows.length > 0 && <span className="text-muted-foreground">({rows.length})</span>}
        </h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No products matched “{term}”.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
  );
}

function ServiceResults({ term }: { term: string }) {
  const services = useServices(term);
  const providers = useProviders();

  const matchedProviders = (providers.data ?? []).filter((provider) =>
    [provider.full_name, provider.headline ?? "", provider.category?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(term.toLowerCase()),
  );
  const rows = services.data ?? [];

  if (services.isLoading || providers.isLoading) {
    return <LoadingState label="Searching services…" className="mt-8" />;
  }
  if (services.isError || providers.isError) {
    return (
      <div className="mt-8">
        <ErrorState
          title="Search failed"
          action={
            <Button
              onClick={() => {
                void services.refetch();
                void providers.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      </div>
    );
  }
  if (rows.length === 0 && matchedProviders.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={Wrench}
          title={`No services for “${term}”`}
          description="Try “electrician”, “plumber”, “AC” or “salon”."
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {matchedProviders.length > 0 && (
        <section aria-label="Professionals">
          <h2 className="font-display text-lg font-extrabold">Professionals</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {matchedProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>
      )}
      <section aria-label="Services">
        <h2 className="font-display text-lg font-extrabold">Services</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No services matched “{term}”.</p>
        ) : (
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">
            {rows.map((service) => (
              <li key={service.id}>
                <Link
                  to="/provider/$slug"
                  params={{ slug: service.provider?.slug ?? "" }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-display text-sm font-bold">
                      {service.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {service.provider?.full_name ?? "NextNab pro"}
                      {service.duration ? ` · ${service.duration}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-extrabold text-primary">
                    ₹{Number(service.price).toLocaleString("en-IN")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
