import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  quantity,
  onChange,
  disabled,
  className,
}: {
  quantity: number;
  onChange: (next: number) => void;
  disabled?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled}
        onClick={() => onChange(quantity - 1)}
        className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-7 text-center text-sm font-bold tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled}
        onClick={() => onChange(quantity + 1)}
        className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-brand disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
