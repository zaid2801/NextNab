import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  ClipboardCheck,
  Handshake,
  Headphones,
  IndianRupee,
  LogIn,
  Quote,
  Store,
  Timer,
  TrendingUp,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import groceriesImage from "@/assets/groceries.jpg";
import servicesImage from "@/assets/home-services.jpg";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { container } from "@/lib/design-system";

const title = "Become a NextNab Partner in Latur";
const description =
  "Sell groceries, offer home services or deliver orders with NextNab. Free onboarding for Latur shops, professionals and riders.";

export const Route = createFileRoute("/partner/")({
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
  component: PartnerPage,
});

const BENEFITS = [
  {
    icon: Timer,
    tile: "bg-accent text-primary",
    title: "Hyperlocal Velocity",
    description:
      "Reach customers in your exact neighbourhood with rapid, reliable delivery logistics.",
  },
  {
    icon: TrendingUp,
    tile: "bg-[#d9f2e4] text-[#006c49]",
    title: "Zero Marketing Cost",
    description: "We bring the customers to you. No hidden fees or expensive advertising required.",
  },
  {
    icon: Wallet,
    tile: "bg-[#ffeed6] text-[#7d4e00]",
    title: "Weekly Payments",
    description: "Enjoy predictable, transparent cash flow with automated weekly settlements.",
  },
  {
    icon: Headphones,
    tile: "bg-[#ffe3e0] text-[#93000a]",
    title: "Dedicated Support",
    description: "Get help anytime with our dedicated local partner support team based right here.",
  },
];

const STEPS = [
  {
    title: "Register",
    description: "Sign up via the Partner App and upload your basic business details and ID.",
  },
  {
    title: "Verify",
    description: "Our local team completes a quick verification call and profile approval.",
  },
  {
    title: "Start Earning",
    description: "Go live on NextNab and watch your local orders roll in.",
  },
];

function PartnerPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <img
          src={groceriesImage}
          alt="Busy local market in Latur"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className={`${container} relative py-20 lg:py-28`}>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-brand">
            <Handshake className="size-3.5" aria-hidden="true" /> NextNab Partners
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Grow Your Business with NextNab in <span className="text-gradient">Latur</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Join the fastest growing hyperlocal quick-commerce and home services network. Zero
            marketing cost, instant local reach, and dedicated support to scale your operations.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/partner/join">
              <Button size="lg">
                Register My Business <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document.getElementById("steps")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How It Works
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-3 rounded-2xl bg-card/90 px-4 py-3 shadow-soft backdrop-blur-md">
              <span className="grid size-9 place-items-center rounded-full bg-[#d9f2e4] text-[#006c49]">
                <Store className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-sm font-extrabold">150+</span>
                <span className="block text-[11px] font-semibold text-muted-foreground">
                  Active Partners
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-3 rounded-2xl bg-card/90 px-4 py-3 shadow-soft backdrop-blur-md">
              <span className="grid size-9 place-items-center rounded-full bg-[#ffeed6] text-[#7d4e00]">
                <IndianRupee className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-sm font-extrabold">Weekly</span>
                <span className="block text-[11px] font-semibold text-muted-foreground">
                  Guaranteed Payouts
                </span>
              </span>
            </span>
          </div>
        </div>
      </section>

      <section className={`${container} py-16 lg:py-20`}>
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Why Partner with NextNab?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Everything you need to manage your business efficiently and reach thousands of local
          customers instantly.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-2xl border border-border/60 bg-secondary/60 p-6 shadow-soft"
            >
              <span className={`grid size-11 place-items-center rounded-xl ${benefit.tile}`}>
                <benefit.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-extrabold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/50 py-16 lg:py-20">
        <div className={`${container} grid gap-6 lg:grid-cols-2`}>
          <AudienceCard
            image={groceriesImage}
            badge="Retail & Commerce"
            badgeClass="bg-[#6ffbbe] text-[#00432b]"
            title="For Shop Owners"
            description="Perfect for groceries, pharmacies, bakeries, and local essentials. Tap into the quick-commerce revolution. We handle the delivery fleet; you just pack the orders."
            cta="Register Shop"
            to="/partner/join"
            type="shopkeeper"
            icon={Store}
          />
          <AudienceCard
            image={servicesImage}
            badge="Skilled Services"
            badgeClass="bg-brand text-white"
            title="For Service Professionals"
            description="Electricians, plumbers, AC repair, and cleaning experts. Fill your daily schedule with verified bookings from nearby homes and offices."
            cta="Register Services"
            to="/partner/join"
            type="service_provider"
            icon={Wrench}
          />
        </div>
        <p className={`${container} mt-6 text-center text-sm text-muted-foreground`}>
          Prefer the open road?{" "}
          <Link
            to="/partner/join"
            search={{ type: "rider" }}
            className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
          >
            <Bike className="size-4" aria-hidden="true" /> Join as a delivery rider
          </Link>
        </p>
      </section>

      <section id="steps" className={`${container} scroll-mt-24 py-16 lg:py-20`}>
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Start Earning in 3 Steps
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          Our streamlined onboarding process gets you live and receiving orders in less than 48
          hours.
        </p>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col items-center text-center">
              <span
                className={
                  index === 2
                    ? "grid size-14 place-items-center rounded-full bg-primary font-display text-xl font-extrabold text-primary-foreground shadow-brand"
                    : "grid size-14 place-items-center rounded-full bg-accent font-display text-xl font-extrabold text-primary"
                }
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-base font-extrabold">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${container} pb-16 lg:pb-20`}>
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="relative overflow-hidden rounded-3xl shadow-card">
            <img
              src="/delivery-hero.png"
              alt="Verified NextNab delivery partner in Latur"
              className="size-full object-cover"
            />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl bg-card/95 px-3 py-2 text-xs font-bold shadow-soft">
              <BadgeCheck className="size-4 text-[#006c49]" aria-hidden="true" /> Verified NextNab
              Partner
            </span>
          </div>
          <div className="rounded-3xl bg-secondary p-8 lg:p-10">
            <Quote className="size-7 text-primary" aria-hidden="true" />
            <p className="mt-4 font-display text-lg font-bold leading-relaxed sm:text-xl">
              &ldquo;Joining NextNab completely transformed how we do business in Latur. We used to
              rely entirely on foot traffic, but now we&rsquo;re serving orders 5 kilometers away.
              The weekly payments are incredibly reliable.&rdquo;
            </p>
            <p className="mt-5 font-display text-sm font-extrabold">Amit Deshmukh</p>
            <p className="text-xs text-muted-foreground">Owner, Deshmukh Super Mart</p>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(160deg,var(--brand)_0%,var(--primary)_100%)] py-16 text-center text-primary-foreground">
        <div className={container}>
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Join 150+ Local Partners in Latur Today
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/85">
            Take control of your growth. Complete your registration in under 5 minutes.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/partner/join">
              <Button size="lg" className="bg-card text-primary shadow-card hover:bg-secondary">
                <Zap className="size-4" aria-hidden="true" /> Register Now
              </Button>
            </Link>
            <Link to="/partner/login">
              <Button
                size="lg"
                className="border border-white/40 bg-transparent text-primary-foreground shadow-none hover:bg-white/10"
              >
                <LogIn className="size-4" aria-hidden="true" /> Partner Login
              </Button>
            </Link>
          </div>
          <Link
            to="/partner/status"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-foreground/85 hover:underline"
          >
            <ClipboardCheck className="size-4" aria-hidden="true" /> Check application status
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function AudienceCard({
  image,
  badge,
  badgeClass,
  title,
  description,
  cta,
  to,
  type,
  icon: Icon,
}: {
  image: string;
  badge: string;
  badgeClass: string;
  title: string;
  description: string;
  cta: string;
  to: "/partner/join";
  type: "shopkeeper" | "service_provider";
  icon: typeof Store;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
      <div className="relative h-56">
        <img src={image} alt="" className="size-full object-cover" />
      </div>
      <div className="p-7">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${badgeClass}`}
        >
          <Icon className="size-3" aria-hidden="true" /> {badge}
        </span>
        <h3 className="mt-3 font-display text-xl font-extrabold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Link to={to} search={{ type }} className="mt-5 inline-block">
          <Button variant="outline">
            {cta} <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
