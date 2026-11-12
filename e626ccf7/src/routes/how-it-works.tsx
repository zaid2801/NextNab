import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  Clock,
  CreditCard,
  MapPin,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Wrench,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { card, container, sectionSubtitle, sectionTitle } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const title = "How NextNab Works — Latur Delivery & Home Services";
const description =
  "Browse and select, order or book, then relax and receive. See how NextNab brings groceries and home services to your door in Latur.";

export const Route = createFileRoute("/how-it-works")({
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
  component: HowItWorksPage,
});

const grocerySteps = [
  {
    icon: MapPin,
    title: "Set your location",
    description:
      "Pick your area in Latur so we can show stores near you with accurate delivery times.",
  },
  {
    icon: SearchCheck,
    title: "Browse local stores",
    description:
      "Search thousands of grocery products from neighbourhood shops — compare prices and deals.",
  },
  {
    icon: ShoppingBag,
    title: "Build your cart",
    description:
      "Add items from one or more stores. Each store's order is billed and delivered separately.",
  },
  {
    icon: CreditCard,
    title: "Pay your way",
    description: "UPI, card or cash on delivery — checkout is secured with 256-bit encryption.",
  },
  {
    icon: Truck,
    title: "Track to your door",
    description:
      "Follow every step from merchant confirmation to rider pickup, live on your order page.",
  },
];

const serviceSteps = [
  {
    icon: Wrench,
    title: "Choose a service",
    description: "Electricians, plumbers, cleaners and more — verified professionals across Latur.",
  },
  {
    icon: Clock,
    title: "Pick a slot",
    description: "Select a date and time that suits you, and share your address and visit details.",
  },
  {
    icon: ShieldCheck,
    title: "Relax, help is on the way",
    description:
      "Track your booking status and pay after the visit. Rate the pro once the job is done.",
  },
];

const partnerTracks = [
  {
    icon: Store,
    title: "Shopkeepers",
    description:
      "List your store, manage stock and accept orders from your merchant dashboard. NextNab brings the customers and the riders.",
    cta: { label: "Register your shop", to: "/partner" as const },
  },
  {
    icon: Wrench,
    title: "Service professionals",
    description:
      "Set your services, pricing and availability. Get booked by customers in your area and get paid weekly.",
    cta: { label: "Join as a professional", to: "/partner" as const },
  },
  {
    icon: Bike,
    title: "Delivery riders",
    description:
      "Go online, accept trips and deliver groceries across Latur. Track every rupee you earn in the rider app dashboard.",
    cta: { label: "Become a rider", to: "/partner" as const },
  },
];

function HowItWorksPage() {
  return (
    <PageShell>
      <div className={`${container} py-12 lg:py-16`}>
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Simple, fast, local
          </p>
          <h1 className={cn(sectionTitle, "mt-3")}>
            How <span className="text-brand">NextNab</span> Works
          </h1>
          <p className={`mx-auto mt-3 max-w-2xl ${sectionSubtitle}`}>
            NextNab connects Latur with its neighbourhood stores, trusted service professionals and
            a fast delivery fleet — all in one app.
          </p>
        </header>

        <section className="mt-12" aria-labelledby="groceries-heading">
          <h2 id="groceries-heading" className="font-display text-xl font-extrabold">
            Grocery delivery in 5 steps
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {grocerySteps.map((step, index) => (
              <li key={step.title} className={cn(card, "relative p-5")}>
                <span className="grid size-11 place-items-center rounded-2xl bg-accent text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="absolute right-4 top-4 font-display text-2xl font-extrabold text-border">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-sm font-extrabold">{step.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <Link to="/groceries">
              <Button size="lg">
                <ShoppingBag className="size-4" aria-hidden="true" /> Start shopping
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="services-heading">
          <h2 id="services-heading" className="font-display text-xl font-extrabold">
            Booking a home service
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {serviceSteps.map((step, index) => (
              <li key={step.title} className={cn(card, "relative p-5")}>
                <span className="grid size-11 place-items-center rounded-2xl bg-[#d9f2e4] text-[#006c49]">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="absolute right-4 top-4 font-display text-2xl font-extrabold text-border">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-sm font-extrabold">{step.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <Link to="/home-services">
              <Button size="lg" variant="outline">
                <Wrench className="size-4" aria-hidden="true" /> Browse home services
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="partners-heading">
          <h2 id="partners-heading" className="font-display text-xl font-extrabold">
            For our partners
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            NextNab is built with Latur&apos;s shops, professionals and riders — not at their
            expense.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {partnerTracks.map((track) => (
              <div key={track.title} className={cn(card, "flex flex-col p-6")}>
                <span className="grid size-11 place-items-center rounded-2xl bg-[#ffeed6] text-[#7d4e00]">
                  <track.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-extrabold">{track.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{track.description}</p>
                <Link to={track.cta.to} className="mt-4">
                  <Button variant="outline" size="sm">
                    {track.cta.label}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className={cn(card, "mt-14 bg-accent/50 p-8 text-center")}>
          <h2 className="font-display text-xl font-extrabold">Still have questions?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Visit our Help Center for answers about orders, payments, cancellations and partner
            onboarding.
          </p>
          <Link to="/help" className="mt-5 inline-block">
            <Button size="lg">Go to Help Center</Button>
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
