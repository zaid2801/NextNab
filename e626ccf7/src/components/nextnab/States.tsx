import type { ReactNode } from "react";
import { Loader2, PackageOpen, TriangleAlert, type LucideIcon } from "lucide-react";
import { card } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("grid place-items-center gap-3 py-20 text-muted-foreground", className)}>
      <Loader2 className="size-7 animate-spin text-primary" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(card, "overflow-hidden")}>
          <div className="aspect-square animate-pulse bg-secondary" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-secondary" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-secondary" />
            <div className="h-5 w-1/2 animate-pulse rounded-full bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn(card, "mx-auto max-w-lg px-6 py-14 text-center")}>
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-xl font-extrabold">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title={title}
      description={description ?? "We couldn't load this right now. Please try again."}
      action={action}
    />
  );
}
