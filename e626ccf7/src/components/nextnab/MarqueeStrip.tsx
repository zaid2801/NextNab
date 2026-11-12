import { BadgeCheck, Bike, Leaf, MapPin, ShieldCheck, Wallet } from "lucide-react";

const items = [
  { icon: Bike, label: "20-min grocery delivery" },
  { icon: ShieldCheck, label: "Verified local pros" },
  { icon: MapPin, label: "Live rider tracking" },
  { icon: Wallet, label: "UPI · Cards · COD" },
  { icon: Leaf, label: "Fresh produce daily" },
  { icon: BadgeCheck, label: "Latur-first support" },
];

/** Infinite scrolling trust strip. Content is duplicated for a seamless loop. */
export function MarqueeStrip() {
  const loop = [...items, ...items];
  return (
    <div
      aria-hidden="true"
      className="relative mb-14 overflow-hidden border-y border-border/60 bg-card/60 py-3.5 backdrop-blur"
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="animate-nn-marquee flex w-max items-center gap-10">
        {loop.map((item, index) => (
          <span
            key={`${item.label}-${index}`}
            className="flex items-center gap-2.5 text-sm font-semibold text-muted-foreground"
          >
            <span className="grid size-7 place-items-center rounded-full bg-secondary text-primary">
              <item.icon className="size-3.5" />
            </span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
