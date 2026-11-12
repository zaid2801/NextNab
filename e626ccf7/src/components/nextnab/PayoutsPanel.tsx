import { IndianRupee } from "lucide-react";
import { Panel } from "./DashboardShell";
import { usePayouts } from "@/hooks/usePayouts";
import { formatDate, inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PayoutsPanel({ partnerId }: { partnerId: string | undefined }) {
  const { data: payouts = [], isLoading } = usePayouts(partnerId);

  const paid = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + Number(payout.amount), 0);
  const pending = payouts
    .filter((payout) => payout.status === "pending")
    .reduce((sum, payout) => sum + Number(payout.amount), 0);

  return (
    <Panel title="Payouts">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-secondary p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <IndianRupee className="size-3.5" aria-hidden="true" /> Total paid
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-primary">{inr(paid)}</p>
        </div>
        <div className="rounded-2xl bg-secondary p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <IndianRupee className="size-3.5" aria-hidden="true" /> Pending
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold">{inr(pending)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading payouts…</p>
      ) : payouts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No payouts yet. NextNab settles your earnings weekly.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {payouts.map((payout) => (
            <li key={payout.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{inr(payout.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(payout.period_start)} → {formatDate(payout.period_end)}
                  {payout.paid_at ? ` · Paid ${formatDate(payout.paid_at)}` : ""}
                </p>
              </div>
              {payout.note && (
                <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
                  {payout.note}
                </p>
              )}
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold",
                  payout.status === "paid"
                    ? "bg-primary/15 text-primary"
                    : "bg-accent text-primary",
                )}
              >
                {payout.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
