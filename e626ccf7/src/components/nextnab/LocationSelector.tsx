import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { cn } from "@/lib/utils";

export function LocationSelector({ className }: { className?: string }) {
  const { locations, isLoading, selected, select, label } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Delivery location: ${label}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-brand-light"
      >
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="max-w-[36vw] truncate sm:max-w-none">{label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Delivery areas"
          className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-card"
        >
          <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Deliver to
          </p>
          {isLoading ? (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading areas…
            </p>
          ) : (
            <>
              <button
                type="button"
                role="option"
                aria-selected={selected === null}
                onClick={() => {
                  select(null);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-secondary",
                  selected === null && "bg-secondary text-primary",
                )}
              >
                All Latur
                {selected === null && <Check className="size-4" aria-hidden="true" />}
              </button>
              {locations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  role="option"
                  aria-selected={selected?.id === location.id}
                  onClick={() => {
                    select(location.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-secondary",
                    selected?.id === location.id && "bg-secondary text-primary",
                  )}
                >
                  {location.area ?? location.city}
                  {selected?.id === location.id && <Check className="size-4" aria-hidden="true" />}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
