import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type CategoryCardProps = {
  to: "/groceries" | "/home-services";
  title: string;
  description: string;
  badge: string;
  badgeIcon: LucideIcon;
  badgeClassName: string;
  image: string;
  imageAlt: string;
};

export function CategoryCard({
  to,
  title,
  description,
  badge,
  badgeIcon: BadgeIcon,
  badgeClassName,
  image,
  imageAlt,
}: CategoryCardProps) {
  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-3xl shadow-card transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <img
        src={image}
        alt={imageAlt}
        loading="lazy"
        width={1024}
        height={768}
        className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/5" />

      <div className="absolute inset-x-0 bottom-0 p-6">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeClassName}`}
        >
          <BadgeIcon className="size-3.5" aria-hidden="true" />
          {badge}
        </span>
        <h3 className="mt-3 font-display text-2xl font-extrabold text-white sm:text-3xl">
          {title}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-white/80">{description}</p>
      </div>
    </Link>
  );
}
