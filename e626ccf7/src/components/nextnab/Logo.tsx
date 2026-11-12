import { Link } from "@tanstack/react-router";
import markAsset from "@/assets/nextnab-mark.png";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="NextNab home">
      <img
        src={markAsset}
        alt="NextNab logo"
        width={28}
        height={28}
        className="size-7 object-contain"
      />
      {showWordmark && (
        <span className="font-display text-xl font-extrabold tracking-tight text-primary">
          NextNab
        </span>
      )}
    </Link>
  );
}
