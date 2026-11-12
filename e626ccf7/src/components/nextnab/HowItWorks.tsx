import { CreditCard, SearchCheck, Truck } from "lucide-react";
import { container, sectionSubtitle, sectionTitle } from "@/lib/design-system";

const steps = [
  {
    icon: SearchCheck,
    title: "Browse & Select",
    description: "Find exactly what you need from local stores and verified service providers.",
    iconClass: "bg-accent text-primary",
    badgeClass: "bg-brand",
  },
  {
    icon: CreditCard,
    title: "Order or Book",
    description: "Securely checkout with your preferred payment method in seconds.",
    iconClass: "bg-[#d9f2e4] text-[#006c49]",
    badgeClass: "bg-[#006c49]",
  },
  {
    icon: Truck,
    title: "Relax & Receive",
    description: "Track your order live. Groceries arrive in minutes, pro services arrive on time.",
    iconClass: "bg-[#ffeed6] text-[#7d4e00]",
    badgeClass: "bg-[#7d4e00]",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={`${container} pb-16 lg:pb-24`}>
      <div className="rounded-[2rem] bg-card px-6 py-14 shadow-card sm:px-10 lg:px-16 lg:py-20">
        <div className="text-center">
          <h2 className={sectionTitle}>
            How <span className="text-brand">NextNab</span> Works
          </h2>
          <p className={`mt-3 ${sectionSubtitle}`}>Simple, fast, and built for your convenience.</p>
        </div>

        <ol className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          <span
            className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-border md:block"
            aria-hidden="true"
          />
          {steps.map((step, index) => (
            <li
              key={step.title}
              data-reveal=""
              style={{ "--nn-d": `${index * 140}ms` } as React.CSSProperties}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative">
                <span className={`grid size-14 place-items-center rounded-2xl ${step.iconClass}`}>
                  <step.icon className="size-6" aria-hidden="true" />
                </span>
                <span
                  className={`absolute -right-2 -top-2 grid size-6 place-items-center rounded-full text-[11px] font-bold text-white ${step.badgeClass}`}
                >
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
