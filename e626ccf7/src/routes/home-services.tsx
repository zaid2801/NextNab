import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BadgeIndianRupee,
  Droplets,
  Hammer,
  Paintbrush,
  Scissors,
  Search,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Star,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { LoadingState, EmptyState } from "@/components/nextnab/States";
import { useProviders, useServiceCategories } from "@/hooks/useCatalog";
import { container } from "@/lib/design-system";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProviderWithCategory } from "@/types";

const title = "Trusted Home Services in Latur — NextNab";
const description =
  "Book verified electricians, plumbers, cleaners and carpenters in Latur. Compare ratings, visit fees and availability on NextNab.";

export const Route = createFileRoute("/home-services")({
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
  component: HomeServicesPage,
});

const CATEGORY_ICON: Record<string, LucideIcon> = {
  electrician: Zap,
  plumber: Droplets,
  "ac-repair": Snowflake,
  "salon-at-home": Scissors,
  cleaning: Sparkles,
  carpentry: Hammer,
  painting: Paintbrush,
};

const CATEGORY_PHOTO: Record<string, string> = {
  electrician: "/services/hero-electrician.jpg",
  plumber: "/services/hero-plumber.jpg",
  "ac-repair": "/services/hero-ac-repair.jpg",
  cleaning: "/services/hero-cleaning.jpg",
};

const POPULAR = [
  { slug: "ac-repair", label: "AC Repair" },
  { slug: "cleaning", label: "Deep Cleaning" },
  { slug: "electrician", label: "Electrician" },
];

const TRUST = [
  { icon: ShieldCheck, heading: "Verified Pros", sub: "Background checked & trained" },
  { icon: BadgeIndianRupee, heading: "Fixed Pricing", sub: "No hidden charges" },
  { icon: Smartphone, heading: "In-App Booking", sub: "Seamless experience" },
  { icon: Star, heading: "Rated 4.8/5", sub: "Based on 10k+ reviews" },
];

const TESTIMONIALS = [
  {
    quote:
      "The AC technician arrived within 30 minutes. Found the issue quickly and fixed it at a very reasonable price. Highly recommend NextNab!",
    name: "Sanjay D.",
    area: "Ausa Road, Latur",
    initial: "S",
    color: "bg-primary",
  },
  {
    quote:
      "Booked salon services for my sister's wedding. The stylist was very professional and hygienic. Saved us so much time.",
    name: "Meera R.",
    area: "Shivaji Nagar, Latur",
    initial: "M",
    color: "bg-secondary",
  },
  {
    quote:
      "Had a major plumbing leak late evening. NextNab pro was a lifesaver. Upfront pricing meant no haggling. Great service.",
    name: "Kiran P.",
    area: "MIDC, Latur",
    initial: "K",
    color: "bg-[#8a5a00]",
  },
];

function HomeServicesPage() {
  const { category: initialCategory } = Route.useSearch();
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [search, setSearch] = useState("");
  const { data: categories = [] } = useServiceCategories();
  const { data: providers = [], isLoading } = useProviders(category);
  const prosRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return providers;
    return providers.filter((provider) =>
      [provider.full_name, provider.headline ?? "", provider.category?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [providers, search]);

  const jumpToPros = () => prosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <img
          src="/services/hero-ac-repair.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover object-[70%_center] opacity-40 lg:opacity-100"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/5"
          aria-hidden="true"
        />
        <div className={`${container} relative py-14 lg:py-20`}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-primary">Expert home services,</span>
            <br />
            delivered instantly.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            From quick fixes to deep cleaning, book trusted professionals in Latur with upfront
            pricing.
          </p>
          <form
            className="mt-7 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5 shadow-card"
            onSubmit={(event) => {
              event.preventDefault();
              jumpToPros();
            }}
          >
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="What service do you need?"
              aria-label="Search home services"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <Button type="submit" className="shrink-0 px-6">
              Search Services
            </Button>
          </form>
        </div>
      </section>

      <div className="border-y border-border/60 bg-surface-low">
        <div className={`${container} flex flex-wrap items-center gap-2 py-4`}>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Popular:
          </span>
          {POPULAR.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => {
                setCategory(item.slug);
                jumpToPros();
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                category === item.slug
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "bg-card text-muted-foreground hover:text-primary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="bg-background">
        <div className={`${container} py-10`}>
          <h2 className="font-display text-lg font-extrabold tracking-tight">Explore Categories</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICON[cat.slug] ?? Wrench;
              const active = category === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(active ? "all" : cat.slug);
                    jumpToPros();
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl px-3 py-5 transition-all duration-300",
                    active
                      ? "bg-accent shadow-card ring-2 ring-primary"
                      : "bg-secondary hover:-translate-y-0.5 hover:shadow-card",
                  )}
                >
                  <span className="grid size-14 place-items-center rounded-full bg-card shadow-soft">
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-accent">
        <div className={`${container} grid grid-cols-2 gap-8 py-9 lg:grid-cols-4`}>
          {TRUST.map((item) => (
            <div key={item.heading} className="flex flex-col items-center text-center">
              <span className="grid size-12 place-items-center rounded-full bg-card shadow-soft">
                <item.icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <p className="mt-3 font-display text-sm font-extrabold">{item.heading}</p>
              <p className="mt-1 text-xs font-semibold text-primary">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={prosRef} className="scroll-mt-20 bg-background">
        <div className={`${container} py-10`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-extrabold tracking-tight">
              Top Rated Professionals
            </h2>
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                setSearch("");
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              See All <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <div className="pt-6">
              <LoadingState label="Finding professionals near you…" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="pt-6">
              <EmptyState
                icon={Wrench}
                title="No professionals matched"
                description="Try a different service category or clear your search."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((provider) => (
                <ProCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface-low py-12">
        <div className={container}>
          <h2 className="text-center font-display text-lg font-extrabold tracking-tight">
            Loved by Latur
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure
                key={item.name}
                className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-1" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="size-4 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm italic leading-relaxed text-muted-foreground">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-full text-sm font-extrabold text-white",
                      item.color,
                    )}
                    aria-hidden="true"
                  >
                    {item.initial}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{item.name}</span>
                    <span className="block text-xs text-muted-foreground">{item.area}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1f2937] py-10">
        <div
          className={`${container} flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center`}
        >
          <div>
            <p className="font-display text-lg font-extrabold text-white">
              Are you a service professional?
            </p>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Join NextNab to grow your business, manage bookings easily, and get paid securely.
              Become a certified partner today.
            </p>
          </div>
          <Link to="/partner/join" className="shrink-0">
            <Button className="px-7">Register as Partner</Button>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function ProCard({ provider }: { provider: ProviderWithCategory }) {
  const photo = provider.category?.slug ? CATEGORY_PHOTO[provider.category.slug] : undefined;
  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative h-40 overflow-hidden bg-secondary">
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid size-full place-items-center font-display text-4xl font-extrabold text-muted-foreground/40">
            {provider.full_name.slice(0, 1)}
          </span>
        )}
        {provider.is_verified && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-soft">
            <BadgeCheck className="size-3" aria-hidden="true" /> Verified
          </span>
        )}
        <span className="absolute -bottom-4 left-4 grid size-10 place-items-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground ring-4 ring-card">
          {provider.full_name.slice(0, 1)}
        </span>
      </div>

      <div className="p-4 pt-6">
        <p className="truncate font-display text-sm font-extrabold">{provider.full_name}</p>
        <p className="truncate text-xs font-semibold text-primary">
          {provider.headline ?? provider.category?.name}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="font-bold text-foreground">{Number(provider.rating).toFixed(1)}</span>
          <span>
            · {provider.jobs_done} jobs · {provider.experience_years} yrs exp.
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Visit fee{" "}
          <span className="font-bold text-foreground">{inr(provider.base_visit_fee ?? 0)}</span>
        </p>
        <Link to="/provider/$slug" params={{ slug: provider.slug }} className="mt-4 block">
          <Button variant="secondary" size="sm" className="w-full">
            Book Now
          </Button>
        </Link>
      </div>
    </article>
  );
}
