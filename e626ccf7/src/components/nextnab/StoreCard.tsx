import { Link } from "@tanstack/react-router";
import { Star, Store as StoreIcon } from "lucide-react";
import type { StoreWithCategory } from "@/types";
import { useLocation } from "@/hooks/useLocation";
import { card } from "@/lib/design-system";
import { distanceKm, formatKm, isStoreOpen } from "@/lib/stores";
import { cn } from "@/lib/utils";

export function StoreCard({ store }: { store: StoreWithCategory }) {
  const { reference } = useLocation();
  const open = isStoreOpen(store);
  const km = distanceKm(
    reference?.latitude ?? null,
    reference?.longitude ?? null,
    store.latitude,
    store.longitude,
  );

  return (
    <Link
      to="/store/$slug"
      params={{ slug: store.slug ?? store.id }}
      className={cn(card, "flex items-center gap-4 p-4 hover:shadow-card-hover")}
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-full bg-secondary">
        {store.image_url ? (
          <img src={store.image_url} alt={store.name} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-primary">
            <StoreIcon className="size-6" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display text-base font-extrabold">{store.name}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
              open ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground",
            )}
          >
            {open ? "OPEN" : "CLOSED"}
          </span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {Number(store.rating ?? 0).toFixed(1)}
          </span>
          {km != null && (
            <>
              <span aria-hidden="true">•</span>
              <span>{formatKm(km)}</span>
            </>
          )}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {store.category?.name ?? "Groceries, Daily Needs"}
        </p>
      </div>
    </Link>
  );
}
