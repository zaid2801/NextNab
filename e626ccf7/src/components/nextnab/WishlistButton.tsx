import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { productIds, toggle } = useWishlist();
  const saved = productIds.has(productId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      disabled={toggle.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate(productId);
      }}
      className={cn(
        "grid size-8 place-items-center rounded-full border border-border bg-card/90 backdrop-blur transition-colors hover:border-brand hover:text-primary",
        saved ? "text-primary" : "text-muted-foreground",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-primary")} aria-hidden="true" />
    </button>
  );
}
