import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepIndicator({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol className="flex items-start">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className={cn("flex items-start", index < steps.length - 1 && "flex-1")}>
            <div className="grid w-16 justify-items-center gap-1.5">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full text-sm font-bold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground shadow-brand",
                  !done && !active && "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-center text-[11px] font-semibold",
                  active || done ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className="mt-4 h-px flex-1 bg-border" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
