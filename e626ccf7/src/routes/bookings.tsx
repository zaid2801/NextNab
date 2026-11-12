import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Clock, MapPin, Wrench, XCircle } from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { LoadingState, EmptyState } from "@/components/nextnab/States";
import { useBookings, useCancelBooking } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { container, card } from "@/lib/design-system";
import { inr } from "@/lib/format";
import type { BookingStatus } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-secondary text-muted-foreground",
  accepted: "bg-accent text-primary",
  on_the_way: "bg-accent text-primary",
  in_progress: "bg-accent text-primary",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const title = "My service bookings — NextNab";
const description =
  "Track your NextNab home service bookings in Latur: scheduled slots, assigned professional and payment status.";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingsPage,
});

function statusLabel(status: BookingStatus | string) {
  return String(status).replace(/_/g, " ");
}

function BookingsPage() {
  const { user, loading } = useAuth();
  const { data: bookings = [], isLoading } = useBookings();
  const cancelBooking = useCancelBooking();

  return (
    <PageShell>
      <div className={`${container} py-8 lg:py-12`}>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          My bookings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every home service visit you've requested through NextNab.
        </p>

        <div className="mt-8">
          {loading || (user && isLoading) ? (
            <LoadingState label="Loading your bookings…" />
          ) : !user ? (
            <EmptyState
              icon={CalendarCheck}
              title="Sign in to see your bookings"
              description="Your service history and upcoming visits live in your NextNab account."
              action={
                <Link to="/login">
                  <Button>Login / Sign up</Button>
                </Link>
              }
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No bookings yet"
              description="Book a verified electrician, plumber or cleaner in Latur — most professionals respond within minutes."
              action={
                <Link to="/home-services">
                  <Button>Browse home services</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-4">
              {bookings.map((booking) => (
                <li key={booking.id} className={`${card} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-extrabold">
                        {booking.service_name}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        #{booking.booking_number}
                        {booking.provider ? ` • ${booking.provider.full_name}` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${
                        STATUS_STYLES[booking.status] ?? "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarCheck className="size-4 text-primary" /> {booking.scheduled_date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4 text-primary" /> {booking.time_slot}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-primary" /> {booking.service_address}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {booking.payment_method}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="font-display text-base font-extrabold">{inr(booking.amount)}</p>
                      {(booking.status === "pending" || booking.status === "confirmed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={cancelBooking.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Cancel booking #${booking.booking_number} for ${booking.service_name}?`,
                              )
                            ) {
                              cancelBooking.mutate(booking.id);
                            }
                          }}
                        >
                          <XCircle className="size-4" aria-hidden="true" /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
