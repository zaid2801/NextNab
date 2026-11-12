import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  ArrowRight,
  Cookie,
  CupSoda,
  Milk,
  ShoppingCart,
  Sparkles,
  SprayCan,
  ShoppingBasket,
  Zap,
} from "lucide-react";
import groceriesImage from "@/assets/groceries.jpg";
import { PageShell } from "@/components/nextnab/PageShell";
import { ProductCard } from "@/components/nextnab/ProductCard";
import { Button } from "@/components/nextnab/Button";
import { PromoSlider, type PromoSlide } from "@/components/nextnab/PromoSlider";
import { SuggestedRail, ShopLocalSection } from "@/components/nextnab/home/SuggestedRail";
import { ErrorState, LoadingState } from "@/components/nextnab/States";
import { useProductCategories, useProducts } from "@/hooks/useCatalog";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { container } from "@/lib/design-system";
import { discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const title = "Groceries & Essentials — NextNab Latur";
const description =
  "Shop fruits, vegetables, dairy, staples and daily essentials in Latur with 20-minute NextNab delivery.";

const CATEGORY_ICONS = [
  { match: /fruit|vegetable|veg/, icon: Apple },
  { match: /dairy|milk|bread|bakery/, icon: Milk },
  { match: /snack|sweet|biscuit/, icon: Cookie },
  { match: /household|clean|home/, icon: SprayCan },
  { match: /care|beauty|personal|hygiene/, icon: Sparkles },
  { match: /beverage|drink|juice|water/, icon: CupSoda },
] as const;

function categoryIcon(slug: string) {
  const hit = CATEGORY_ICONS.find((entry) => entry.match.test(slug));
  return hit?.icon ?? ShoppingBasket;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    badge: "Fresh arrivals",
    title: "Fruits & veg, farm to door",
    subtitle: "Hand-picked produce from farms around Latur, delivered in 20 minutes.",
    ctaLabel: "Shop fruits & veg",
    to: "/groceries",
    search: { category: "fruits-veg" },
    gradient: "from-[#00603f] via-[#0a8f63] to-[#35c98d]",
    icon: Apple,
  },
  {
    badge: "Deal of the day",
    title: "Dairy & breakfast under ₹99",
    subtitle: "Milk, curd, paneer and bread — stocked fresh every single morning.",
    ctaLabel: "Browse dairy",
    to: "/groceries",
    search: { category: "dairy" },
    gradient: "from-[#3d0087] via-[#5300b7] to-[#8b5cf6]",
    icon: Milk,
  },
  {
    badge: "Stock up & save",
    title: "Snacks week, sorted",
    subtitle: "Chips, biscuits, juices and cold drinks at local-store prices.",
    ctaLabel: "See snacks",
    to: "/groceries",
    search: { category: "snacks" },
    gradient: "from-[#9a3412] via-[#c2540a] to-[#f59e0b]",
    icon: Cookie,
  },
];

export const Route = createFileRoute("/groceries")({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search["category"] === "string" ? { category: search["category"] } : {},
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
  component: GroceriesPage,
});

function GroceriesPage() {
  const { category: initialCategory } = Route.useSearch();
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [showAll, setShowAll] = useState(false);
  const { data: categories = [], isLoading: categoriesLoading } = useProductCategories();
  const { data: products = [], isLoading, isError, refetch } = useProducts(category, "");
  const { user } = useAuth();
  const { lines, addItem, setQuantity, count } = useCart();

  const busy = addItem.isPending || setQuantity.isPending;
  const deals = products.filter((product) => discountPercent(product.mrp, product.price) > 0);
  const visible = showAll ? products : deals;

  const scrollToDeals = () => {
    document.getElementById("deals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageShell>
      <div className="sticky top-16 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className={`${container} flex gap-2 overflow-x-auto py-3`}>
          <CategoryPill active={category === "all"} onClick={() => setCategory("all")}>
            <ShoppingBasket className="size-4" aria-hidden="true" />
            All
          </CategoryPill>
          {categories.map((cat) => {
            const Icon = categoryIcon(cat.slug);
            return (
              <CategoryPill
                key={cat.id}
                active={category === cat.slug}
                onClick={() => setCategory(cat.slug)}
              >
                <Icon className="size-4" aria-hidden="true" />
                {cat.name}
              </CategoryPill>
            );
          })}
          {categoriesLoading && <span className="px-2 text-sm text-muted-foreground">…</span>}
        </div>
      </div>

      <section className={`${container} pt-6`}>
        <div className="relative overflow-hidden rounded-[2rem] shadow-card">
          <img
            src={groceriesImage}
            alt="Fresh groceries flying over a kitchen counter"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121c2a]/80 via-[#121c2a]/35 to-transparent" />

          <Link
            to="/cart"
            aria-label={`Open cart, ${count} items`}
            className="absolute right-5 top-5 grid size-14 place-items-center rounded-full bg-card text-primary shadow-card transition-transform hover:scale-105"
          >
            <ShoppingCart className="size-6" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-6 place-items-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                {count}
              </span>
            )}
          </Link>

          <div className="relative flex min-h-[320px] flex-col items-start justify-center gap-4 p-8 sm:min-h-[380px] sm:p-12 lg:min-h-[440px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#6ffbbe] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#00432b]">
              <Zap className="size-3.5" aria-hidden="true" /> Lightning fast
            </span>
            <h1 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Groceries in
              <br />
              <span className="text-[#6ffbbe]">20 Minutes</span>
            </h1>
            <p className="max-w-md text-sm text-white/85 sm:text-base">
              Fresh produce, daily essentials, and local favorites delivered straight to your door
              in Latur.
            </p>
            <Button size="lg" className="mt-2" onClick={scrollToDeals}>
              Start Shopping <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      

      <section id="deals" className={`${container} scroll-mt-32 py-10`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold sm:text-2xl">
            {showAll ? "All Products" : "Deals of the Day"}
          </h2>
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            {showAll ? "Back to deals" : "View All"}{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        {!user && (
          <p className="mt-3 text-xs text-muted-foreground">
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign in
            </Link>{" "}
            to add items to your cart and check out.
          </p>
        )}

        {isLoading ? (
          <LoadingState label="Loading products…" className="py-16" />
        ) : isError ? (
          <ErrorState
            title="Couldn't load products"
            action={<Button onClick={() => void refetch()}>Try again</Button>}
          />
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {showAll
              ? "No products in this category yet — check back soon."
              : "No active deals in this category right now. Tap View All to browse everything."}
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => {
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

      <SuggestedRail mode="grocery" />
      <ShopLocalSection />
    </PageShell>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-brand"
          : "bg-secondary text-foreground hover:bg-accent hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
