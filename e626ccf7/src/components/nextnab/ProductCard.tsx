import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { Product } from "@/types";
import { discountPercent, inr } from "@/lib/format";
import { QuantityStepper } from "./QuantityStepper";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  quantity = 0,
  onAdd,
  onQuantityChange,
  busy,
  className,
}: {
  product: Product;
  quantity?: number;
  onAdd: () => void;
  onQuantityChange: (next: number) => void;
  busy?: boolean;
  className?: string;
}) {
  const off = discountPercent(product.mrp, product.price);
  const out = product.stock <= 0;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-border/60 bg-card p-3 shadow-soft transition-shadow duration-300 hover:shadow-card-hover",
        className,
      )}
    >
      {off > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground shadow-soft">
          -{off}%
        </span>
      )}

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square overflow-hidden rounded-xl bg-secondary"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center font-display text-3xl font-bold text-muted-foreground/40">
            {product.name.slice(0, 1)}
          </div>
        )}
      </Link>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="mt-3 line-clamp-2 font-display text-sm font-bold leading-snug hover:text-primary"
      >
        {product.name}
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">{product.unit}</p>

      <div className="mt-3 flex flex-1 items-end justify-between gap-2">
        <div>
          {off > 0 && (
            <p className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</p>
          )}
          <p className="font-display text-base font-extrabold text-primary">{inr(product.price)}</p>
        </div>

        {out ? (
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Out of stock
          </span>
        ) : quantity > 0 ? (
          <QuantityStepper quantity={quantity} onChange={onQuantityChange} disabled={busy} />
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            aria-label={`Add ${product.name} to cart`}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-primary transition-colors hover:bg-brand hover:text-primary-foreground disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
