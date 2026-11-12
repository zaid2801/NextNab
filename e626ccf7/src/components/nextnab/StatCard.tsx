import type { LucideIcon } from "lucide-react";
import { card } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className={cn(card, "p-5")}>
      <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 font-display text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
