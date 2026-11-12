import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import markAsset from "@/assets/nextnab-mark.png";
import { cn } from "@/lib/utils";

/**
 * Rendered in the SSR shell, so it paints before any JS runs and covers the
 * hydration gap. Fades out once React mounts.
 */
export function AppSplash() {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const fade = setTimeout(() => setFading(true), 150);
    const remove = setTimeout(() => setMounted(false), 700);
    return () => {
      clearTimeout(fade);
      clearTimeout(remove);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-100 grid place-items-center bg-background transition-opacity duration-500",
        fading ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-16 place-items-center rounded-3xl bg-secondary shadow-brand">
          <img src={markAsset} alt="" width={40} height={40} className="size-10 object-contain" />
        </span>
        <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
          NextNab
        </span>
        <span className="relative block h-1 w-40 overflow-hidden rounded-full bg-secondary">
          <span className="absolute inset-y-0 w-1/3 animate-nn-splash-bar rounded-full bg-primary" />
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          Groceries &amp; home services in Latur
        </span>
      </div>
    </div>
  );
}

/** Thin top progress bar shown while the router is loading a route. */
export function RouteLoaderBar() {
  const active = useRouterState({ select: (state) => state.isLoading });

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-90 h-0.5 overflow-hidden transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <span className={cn("block h-full w-1/3 bg-primary", active && "animate-nn-route-bar")} />
    </div>
  );
}
