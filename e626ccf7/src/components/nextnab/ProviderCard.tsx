import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { ProviderWithCategory } from "@/types";
import { card } from "@/lib/design-system";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProviderCard({ provider }: { provider: ProviderWithCategory }) {
  return (
    <Link
      to="/provider/$slug"
      params={{ slug: provider.slug }}
      className={cn(card, "flex gap-4 p-5 hover:shadow-card-hover")}
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
        {provider.avatar_url ? (
          <img src={provider.avatar_url} alt={provider.full_name} className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center font-display text-xl font-bold text-muted-foreground/60">
            {provider.full_name.slice(0, 1)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-display text-base font-bold">{provider.full_name}</p>
          {provider.is_verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
        </div>
        <p className="text-xs font-semibold text-primary">{provider.category?.name}</p>
        {provider.headline && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{provider.headline}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star className="size-3.5 fill-current text-brand" /> {Number(provider.rating).toFixed(1)}
          </span>
          <span>{provider.jobs_done}+ jobs</span>
          <span>{provider.experience_years} yrs exp</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {provider.city}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-muted-foreground">Visit fee</p>
        <p className="font-display text-base font-extrabold">{inr(provider.base_visit_fee ?? 0)}</p>
        {provider.is_online && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-primary">
            Available
          </span>
        )}
      </div>
    </Link>
  );
}
