import { ShieldCheck, Timer } from "lucide-react";
import groceriesImage from "@/assets/groceries.jpg";
import servicesImage from "@/assets/home-services.jpg";
import { CategoryCard, type CategoryCardProps } from "./CategoryCard";
import { container } from "@/lib/design-system";

const categories: CategoryCardProps[] = [
  {
    to: "/groceries",
    title: "Groceries & Essentials",
    description:
      "Fresh produce, daily dairy, and household staples delivered to your door before you know it.",
    badge: "20-min delivery",
    badgeIcon: Timer,
    badgeClassName: "bg-[#6ffbbe] text-[#00432b]",
    image: groceriesImage,
    imageAlt: "Fresh fruit, vegetables and eggs ready for grocery delivery",
  },
  {
    to: "/home-services",
    title: "Trusted Home Services",
    description:
      "Expert plumbers, electricians, salon professionals, and cleaners at your convenience.",
    badge: "Verified pros",
    badgeIcon: ShieldCheck,
    badgeClassName: "bg-brand text-white",
    image: servicesImage,
    imageAlt: "Verified electrician installing a ceiling light in a home",
  },
];

export function CategorySection() {
  return (
    <section className={`${container} pb-16 lg:pb-24`} aria-label="Browse NextNab categories">
      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category, index) => (
          <div
            key={category.to}
            data-reveal=""
            style={{ "--nn-d": `${index * 120}ms` } as React.CSSProperties}
          >
            <CategoryCard {...category} />
          </div>
        ))}
      </div>
    </section>
  );
}
