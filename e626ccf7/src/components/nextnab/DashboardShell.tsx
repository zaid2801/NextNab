import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PageShell } from "./PageShell";
import { LoadingState, EmptyState } from "./States";
import { Button } from "./Button";
import { useAuth } from "@/hooks/useAuth";
import { container, card } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types";
import { Lock } from "lucide-react";

export function RequireRole({ role, children }: { role: AppRole; children: ReactNode }) {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <PageShell>
        <LoadingState label="Checking your access…" />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className={`${container} py-20`}>
          <EmptyState
            icon={Lock}
            title="Partner login required"
            description="Sign in with your NextNab partner account to open this dashboard."
            action={
              <Link to="/partner/login">
                <Button>Partner login</Button>
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  if (!roles.includes(role)) {
    return (
      <PageShell>
        <div className={`${container} py-20`}>
          <EmptyState
            icon={Lock}
            title="You don't have access to this dashboard"
            description={`This area is only for approved ${role.replace("_", " ")} partners. If you've applied, check your application status.`}
            action={
              <>
                <Link to="/partner/status">
                  <Button>Application status</Button>
                </Link>
                <Link to="/">
                  <Button variant="outline">Back to NextNab</Button>
                </Link>
              </>
            }
          />
        </div>
      </PageShell>
    );
  }

  return <>{children}</>;
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <div className={`${container} py-8 lg:py-12`}>
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </header>
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </PageShell>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(card, "p-5 sm:p-6", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h2 className="truncate font-display text-lg font-extrabold">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
