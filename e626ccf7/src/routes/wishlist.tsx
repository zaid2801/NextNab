import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Plus } from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { QuantityStepper } from "@/components/nextnab/QuantityStepper";
import { WishlistButton } from "@/components/nextnab/WishlistButton";
import { EmptyState, ErrorState, LoadingState } from "@/components/nextnab/States";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { card, container } from "@/lib/design-system";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

const title = "Your Wishlist — NextNab";
const description = "Save groceries you love and pick them up later on NextNab Latur.";

export const Route = createFileRoute("/wishlist")({
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
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const { entries, isLoading, isError, refetch } = useWishlist();
  const { lines, addItem, setQuantity } = useCart();
  const busy = addItem.isPending || setQuantity.isPending;

  if (!user) {
    return (
      <PageShell>
        <div className={`${container} py-20`}>
          <EmptyState
            icon={Heart}
            title="Sign in to see your wishlist"
            description="Save products with the heart icon and they'll wait for you here."
            action={
              <Link to="/login">
                <Button>Login / Sign up</Button>
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={`${container} py-10`}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Wishlist</h1>

        {isLoading ? (
          <LoadingState label="Loading your wishlist…" />
        ) : isError ? (
          <ErrorState
            title="Couldn't load your wishlist"
            action={<Button onClick={() => void refetch()}>Try again</Button>}
          />
        ) : entries.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Tap the heart on any product to save it for later."
              action={
                <Link to="/groceries">
                  <Button>Browse groceries</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {entries.map((entry) => {
              const product = entry.product;
              if (!product) return null;
              const line = lines.find((item) => item.product_id === product.id);
              const out = product.stock <= 0;
              return (
                <div key={entry.id} className={cn(card, "relative flex flex-col p-4")}>
                  <WishlistButton productId={product.id} className="absolute right-3 top-3 z-10" />
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="block aspect-square overflow-hidden rounded-2xl bg-secondary"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center font-display text-3xl font-bold text-muted-foreground/40">
                        {product.name.slice(0, 1)}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="mt-3 line-clamp-2 font-display text-sm font-bold leading-snug hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{product.unit}</p>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <span className="font-display text-base font-extrabold">
                      {inr(product.price)}
                    </span>
                    {out ? (
                      <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        Out of stock
                      </span>
                    ) : line ? (
                      <QuantityStepper
                        quantity={line.quantity}
                        disabled={busy}
                        onChange={(next) => setQuantity.mutate({ itemId: line.id, quantity: next })}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => addItem.mutate({ productId: product.id })}
                        aria-label={`Add ${product.name} to cart`}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-brand transition-colors hover:bg-brand disabled:opacity-50"
                      >
                        <Plus className="size-3.5" aria-hidden="true" /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
