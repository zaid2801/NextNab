import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  CreditCard,
  HelpCircle,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  Wrench,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { card, container } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const title = "Help Center — NextNab";
const description =
  "Answers about NextNab orders, payments, cancellations, home services and becoming a partner in Latur.";

export const Route = createFileRoute("/help")({
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
  component: HelpPage,
});

const topics = [
  {
    icon: Package,
    label: "Orders & delivery",
    href: "#orders",
  },
  { icon: CreditCard, label: "Payments & refunds", href: "#payments" },
  { icon: Wrench, label: "Home services", href: "#services" },
  { icon: ShieldCheck, label: "Account & safety", href: "#account" },
  { icon: Store, label: "For partners", href: "#partners" },
];

const faqs: {
  group: string;
  id: string;
  icon: typeof Package;
  items: { q: string; a: string }[];
}[] = [
  {
    group: "Orders & delivery",
    id: "orders",
    icon: Package,
    items: [
      {
        q: "How fast is grocery delivery?",
        a: "Most neighbourhood store orders in Latur arrive within 20–40 minutes of the merchant confirming. You'll see a live estimate on the order page.",
      },
      {
        q: "Can I track my order live?",
        a: "Yes. Open My Orders and select an order to watch it move from 'Merchant confirmed' to 'Out for delivery' to 'Delivered', including your rider's live location once they're on the way.",
      },
      {
        q: "Can I cancel an order?",
        a: "You can cancel from the order page until the merchant confirms or a rider picks it up. Cancelled items are returned to stock and any online payment is refunded.",
      },
      {
        q: "Items from multiple stores?",
        a: "Each store becomes a separate order with its own delivery fee and tracking, so one shop running slow never holds up the rest.",
      },
    ],
  },
  {
    group: "Payments & refunds",
    id: "payments",
    icon: CreditCard,
    items: [
      {
        q: "What payment methods do you accept?",
        a: "UPI (GPay, PhonePe, Paytm), credit/debit cards and Cash on Delivery. COD may include a small handling fee shown at checkout.",
      },
      {
        q: "When do refunds arrive?",
        a: "Refunds for cancelled or failed orders are issued to the original payment method, usually within 3–7 working days depending on your bank.",
      },
      {
        q: "Is checkout secure?",
        a: "Yes — payments run over encrypted connections and card details are handled by our payment provider, never stored on our servers.",
      },
    ],
  },
  {
    group: "Home services",
    id: "services",
    icon: Wrench,
    items: [
      {
        q: "How do I book a professional?",
        a: "Browse Home Services, pick a verified provider, choose a service and a time slot, then confirm your address. You can pay online or after the visit.",
      },
      {
        q: "Can I reschedule or cancel a booking?",
        a: "Bookings can be cancelled from My Bookings while they're still pending or confirmed. For reschedules, cancel and rebook a new slot.",
      },
      {
        q: "Are professionals verified?",
        a: "Every provider passes ID and skill verification before going live. Their rating, jobs completed and reviews are shown on their profile.",
      },
    ],
  },
  {
    group: "Account & safety",
    id: "account",
    icon: ShieldCheck,
    items: [
      {
        q: "How do I verify my email?",
        a: "After signing up we email a 6-digit code. Enter it on the verification screen to activate your account. You can resend the code if it expires.",
      },
      {
        q: "I forgot my password.",
        a: "On the login page choose 'Forgot password' and we'll email a secure link to set a new one.",
      },
      {
        q: "How do I change my address?",
        a: "Go to Account → Addresses to add, edit or set a default delivery address.",
      },
    ],
  },
  {
    group: "For partners",
    id: "partners",
    icon: Store,
    items: [
      {
        q: "How do I register my shop?",
        a: "Choose Partner with Us, select Shopkeeper, and submit your store and KYC details. Our Latur team reviews applications and opens your merchant dashboard once approved.",
      },
      {
        q: "How do partners get paid?",
        a: "Earnings are settled weekly. You'll see pending and paid payouts in your dashboard's Payouts section.",
      },
      {
        q: "How do I become a rider?",
        a: "Apply as a Delivery Rider with your vehicle and licence details. After verification you can go online and start accepting trips.",
      },
    ],
  },
];

function HelpPage() {
  return (
    <PageShell>
      <div className={`${container} py-12 lg:py-16`}>
        <header className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
            <HelpCircle className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Quick answers about ordering, payments, services and partnering with NextNab in Latur.
          </p>
        </header>

        <nav
          aria-label="Help topics"
          className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2"
        >
          {topics.map((topic) => (
            <a
              key={topic.href}
              href={topic.href}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-primary"
            >
              <topic.icon className="size-4" aria-hidden="true" />
              {topic.label}
            </a>
          ))}
        </nav>

        <div className="mx-auto mt-10 max-w-3xl space-y-10">
          {faqs.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
                <span className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
                  <section.icon className="size-4" aria-hidden="true" />
                </span>
                {section.group}
              </h2>
              <div className="mt-4 space-y-2">
                {section.items.map((item) => (
                  <details key={item.q} className={cn(card, "group p-0 open:shadow-card-hover")}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-display text-sm font-bold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-primary transition-transform group-open:rotate-45"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </summary>
                    <p className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className={cn(card, "mx-auto mt-12 max-w-3xl bg-accent/50 p-8")}>
          <h2 className="text-center font-display text-xl font-extrabold">Still need a hand?</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            Our Latur support team is available 7 days a week, 8 AM to 10 PM.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <a
              href="tel:+919000000000"
              className="flex items-center gap-3 rounded-2xl bg-card p-4 text-sm font-semibold shadow-soft transition-colors hover:text-primary"
            >
              <Phone className="size-5 text-primary" aria-hidden="true" />
              <span>
                Call us
                <span className="block text-xs font-normal text-muted-foreground">
                  +91 90000 00000
                </span>
              </span>
            </a>
            <a
              href="mailto:support@nextnab.in"
              className="flex items-center gap-3 rounded-2xl bg-card p-4 text-sm font-semibold shadow-soft transition-colors hover:text-primary"
            >
              <Mail className="size-5 text-primary" aria-hidden="true" />
              <span>
                Email
                <span className="block text-xs font-normal text-muted-foreground">
                  support@nextnab.in
                </span>
              </span>
            </a>
            <div className="flex items-center gap-3 rounded-2xl bg-card p-4 text-sm font-semibold shadow-soft">
              <MapPin className="size-5 text-primary" aria-hidden="true" />
              <span>
                Visit
                <span className="block text-xs font-normal text-muted-foreground">
                  Ganj Golai, Latur
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-sm text-muted-foreground">
            Want to earn with NextNab?{" "}
            <Link to="/partner" className="font-semibold text-primary hover:underline">
              Become a partner
            </Link>{" "}
            ·{" "}
            <Link to="/how-it-works" className="font-semibold text-primary hover:underline">
              See how it works
            </Link>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/orders">
              <Button variant="outline" size="sm">
                <Package className="size-4" aria-hidden="true" /> My orders
              </Button>
            </Link>
            <Link to="/bookings">
              <Button variant="outline" size="sm">
                <Wrench className="size-4" aria-hidden="true" /> My bookings
              </Button>
            </Link>
            <Link to="/rider">
              <Button variant="outline" size="sm">
                <Bike className="size-4" aria-hidden="true" /> Rider dashboard
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
