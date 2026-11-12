import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "./PageShell";
import { Logo } from "./Logo";
import { container } from "@/lib/design-system";
import { cn } from "@/lib/utils";

/** Lavender onboarding canvas with soft blobs and a centered white card. */
export function PartnerShell({
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
  wide,
  aside,
}: {
  icon?: LucideIcon | undefined;
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  wide?: boolean | undefined;
  aside?: ReactNode | undefined;
}) {
  return (
    <PageShell>
      <div className="relative overflow-hidden">
        <span
          className="brand-blob -right-24 -top-24 size-[420px] rounded-full bg-accent"
          aria-hidden="true"
        />
        <span
          className="brand-blob -left-24 bottom-0 size-[380px] rounded-full bg-[#d9ece4]"
          aria-hidden="true"
        />
        <div className={`${container} relative py-12`}>
          <div
            className={cn(
              "mx-auto overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card",
              aside ? "max-w-5xl" : wide ? "max-w-5xl" : "max-w-2xl",
            )}
          >
            <div className={cn(aside && "lg:grid lg:grid-cols-2")}>
              {aside}
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="text-center">
                  <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary">
                    {Icon ? (
                      <Icon className="size-8 text-primary" aria-hidden="true" />
                    ) : (
                      <Logo showWordmark={false} className="pointer-events-none" />
                    )}
                  </span>
                  <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {title}
                  </h1>
                  {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                <div className="mt-8">{children}</div>
              </div>
            </div>
          </div>
          {footer && <div className="mx-auto mt-8 max-w-5xl">{footer}</div>}
        </div>
      </div>
    </PageShell>
  );
}
