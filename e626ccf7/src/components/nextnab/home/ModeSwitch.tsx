import { Briefcase, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

export type HomeMode = "grocery" | "services";

export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: HomeMode;
  onChange: (mode: HomeMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Browse mode"
      className="grid grid-cols-2 gap-1 rounded-full border border-border bg-card p-1 shadow-soft"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "grocery"}
        onClick={() => onChange("grocery")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-colors",
          mode === "grocery"
            ? "bg-primary text-primary-foreground shadow-brand"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ShoppingBasket className="size-4" aria-hidden="true" /> Grocery
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "services"}
        onClick={() => onChange("services")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-colors",
          mode === "services"
            ? "bg-primary text-primary-foreground shadow-brand"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Briefcase className="size-4" aria-hidden="true" /> Services
      </button>
    </div>
  );
}
