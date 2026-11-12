import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Banknote,
  CalendarCheck,
  Clock,
  IndianRupee,
  LayoutDashboard,
  MapPin,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { RequireRole } from "@/components/nextnab/DashboardShell";
import { Button } from "@/components/nextnab/Button";
import { Field, TextInput } from "@/components/nextnab/Form";
import { EmptyState, ErrorState, LoadingState } from "@/components/nextnab/States";
import { NotificationsBell } from "@/components/nextnab/NotificationsBell";
import { PayoutsPanel } from "@/components/nextnab/PayoutsPanel";
import { PerformanceChart } from "@/components/nextnab/PerformanceChart";
import { useServiceCategories } from "@/hooks/useCatalog";
import {
  useCreateService,
  useDeleteService,
  useMyProviderProfile,
  useProviderBookings,
  useProviderServices,
  useToggleProviderOnline,
  useUpdateBookingStatus,
  useUpdateProviderProfile,
  useUpdateService,
  type ServiceDraft,
} from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { dayKey, formatDate, inr, last7Days } from "@/lib/format";
import { card, container } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type {
  BookingStatus,
  Review,
  Service,
  ServiceBooking,
  ServiceCategory,
  ServiceProvider,
} from "@/types";

const title = "Service provider dashboard — NextNab";
const description =
  "Manage your NextNab service jobs: accept bookings, update job status and track your earnings in Latur.";

export const Route = createFileRoute("/provider/")({
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
  component: () => (
    <RequireRole role="service_provider">
      <ProviderDashboard />
    </RequireRole>
  ),
});

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "services", label: "Inventory & Services", icon: Wrench },
  { id: "bookings", label: "Orders & Bookings", icon: CalendarCheck },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "payouts", label: "Payouts", icon: Wallet },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

const NEXT_STATUS: Partial<Record<BookingStatus, { status: BookingStatus; label: string }>> = {
  pending: { status: "confirmed", label: "Accept booking" },
  confirmed: { status: "in_progress", label: "Start job" },
  in_progress: { status: "completed", label: "Mark completed" },
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "New",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function useProviderReviews(providerId: string | undefined) {
  return useQuery({
    queryKey: ["provider-reviews", providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", providerId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function isActiveBooking(booking: ServiceBooking): boolean {
  return booking.status !== "completed" && booking.status !== "cancelled";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-brand">
      {initials(name) || <Wrench className="size-5" aria-hidden="true" />}
    </span>
  );
}

function Switch({
  on,
  onToggle,
  disabled,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        on ? "bg-primary" : "bg-border",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function OnlinePill({
  online,
  busy,
  onToggle,
}: {
  online: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/70 bg-card p-1 shadow-soft">
      <button
        type="button"
        disabled={busy}
        onClick={() => !online && onToggle()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
          online
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Power className="size-3.5" aria-hidden="true" /> Online
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => online && onToggle()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
          !online ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <PowerOff className="size-3.5" aria-hidden="true" /> Offline
      </button>
    </div>
  );
}

function Sidebar({ tab, onTab }: { tab: TabId; onTab: (next: TabId) => void }) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors lg:rounded-2xl",
                active
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className={cn(card, "mt-4 hidden p-4 lg:block")}>
        <p className="inline-flex items-center gap-2 text-sm font-bold">
          <BadgeCheck className="size-4 text-primary" aria-hidden="true" /> Verified partner
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Background checked & trained by NextNab Latur.
        </p>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-bold",
        status === "completed"
          ? "bg-primary/15 text-primary"
          : status === "cancelled"
            ? "bg-destructive/10 text-destructive"
            : status === "in_progress"
              ? "bg-accent text-primary"
              : "bg-secondary text-foreground",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function BookingRow({
  booking,
  busy,
  onAct,
}: {
  booking: ServiceBooking;
  busy: boolean;
  onAct: (status: BookingStatus) => void;
}) {
  const next = NEXT_STATUS[booking.status];
  return (
    <li className="grid gap-3 rounded-2xl border border-border p-4 sm:flex sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
          <Wrench className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{booking.service_name}</p>
          <p className="truncate text-xs text-muted-foreground">#{booking.booking_number}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {booking.service_address && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                {booking.service_address}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {formatDate(booking.scheduled_date)} · {booking.time_slot}
            </span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-sm font-extrabold">{inr(Number(booking.amount))}</span>
        <StatusChip status={booking.status} />
        {next && (
          <Button variant="secondary" size="sm" loading={busy} onClick={() => onAct(next.status)}>
            {next.label}
          </Button>
        )}
      </div>
    </li>
  );
}

type FeedEvent = {
  id: string;
  icon: LucideIcon;
  tone: "money" | "star" | "booking";
  title: string;
  meta: string;
  quote?: string | null;
  at: string;
};

function buildFeed(bookings: ServiceBooking[], reviews: Review[]): FeedEvent[] {
  const events: FeedEvent[] = [
    ...bookings.map((booking): FeedEvent => {
      if (booking.status === "completed") {
        return {
          id: `pay-${booking.id}`,
          icon: Banknote,
          tone: "money",
          title: `Payment received ${inr(Number(booking.amount))}`,
          meta: `${formatDate(booking.scheduled_date)} · ${booking.service_name}`,
          at: booking.updated_at,
        };
      }
      return {
        id: `book-${booking.id}`,
        icon: CalendarCheck,
        tone: "booking",
        title:
          booking.status === "pending"
            ? "New booking request"
            : booking.status === "in_progress"
              ? "Job in progress"
              : "Booking confirmed",
        meta: `${formatDate(booking.scheduled_date)} · ${booking.service_name}`,
        at: booking.created_at,
      };
    }),
    ...reviews.map((review): FeedEvent => ({
      id: `review-${review.id}`,
      icon: Star,
      tone: "star",
      title: review.comment ? "New customer review" : `Rated ${review.rating} stars`,
      meta: `${review.author_name} · ${review.rating} stars`,
      quote: review.comment,
      at: review.created_at,
    })),
  ];
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
}

function ActivityFeed({ bookings, reviews }: { bookings: ServiceBooking[]; reviews: Review[] }) {
  const feed = useMemo(() => buildFeed(bookings, reviews), [bookings, reviews]);
  if (feed.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Activity from bookings and reviews will appear here.
      </p>
    );
  }
  return (
    <ul className="mt-4 space-y-4">
      {feed.map((event) => {
        const Icon = event.icon;
        return (
          <li key={event.id} className="flex gap-3">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                event.tone === "money"
                  ? "bg-primary/15 text-primary"
                  : event.tone === "star"
                    ? "bg-accent text-primary"
                    : "bg-secondary text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{event.title}</p>
              {event.quote && (
                <p className="mt-1 line-clamp-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs italic text-muted-foreground">
                  “{event.quote}”
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">{event.meta}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ServiceForm({
  providerId,
  categories,
  service,
  onDone,
}: {
  providerId: string;
  categories: ServiceCategory[];
  service?: Service;
  onDone: () => void;
}) {
  const create = useCreateService();
  const update = useUpdateService();
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [duration, setDuration] = useState(service?.duration ?? "");
  const [categoryId, setCategoryId] = useState(service?.category_id ?? "");
  const [description, setDescription] = useState(service?.description ?? "");

  const busy = create.isPending || update.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) return;
    const draft: ServiceDraft = {
      provider_id: providerId,
      name: name.trim(),
      price: parsedPrice,
      duration: duration.trim() || null,
      category_id: categoryId || null,
      description: description.trim() || null,
    };
    if (service) {
      const { provider_id: _ignored, ...patch } = draft;
      update.mutate({ id: service.id, patch }, { onSuccess: onDone });
    } else {
      create.mutate(draft, { onSuccess: onDone });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 space-y-4 rounded-2xl border border-brand/40 bg-surface-low p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-extrabold">
          {service ? `Edit ${service.name}` : "Add a service"}
        </h3>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close service form"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service name" required>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Fan repair"
          />
        </Field>
        <Field label="Price (₹)" required>
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="199"
          />
        </Field>
        <Field label="Duration">
          <TextInput
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="45 mins"
          />
        </Field>
        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-12 w-full rounded-2xl border border-border bg-surface-low px-4 text-sm outline-none focus:border-brand focus:bg-card"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <TextInput
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's included in this service"
        />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" loading={busy}>
          {service ? "Save changes" : "Add service"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ServiceRow({
  service,
  providerId,
  categories,
}: {
  service: Service;
  providerId: string;
  categories: ServiceCategory[];
}) {
  const update = useUpdateService();
  const remove = useDeleteService();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <li>
        <ServiceForm
          providerId={providerId}
          categories={categories}
          service={service}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{service.name}</p>
        <p className="text-xs text-muted-foreground">
          {inr(service.price)}
          {service.duration ? ` · ${service.duration}` : ""}
        </p>
      </div>
      <Button
        size="sm"
        variant={service.is_active ? "outline" : "primary"}
        loading={update.isPending}
        onClick={() => update.mutate({ id: service.id, patch: { is_active: !service.is_active } })}
      >
        {service.is_active ? "Pause" : "Activate"}
      </Button>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        aria-label={`Edit ${service.name}`}
      >
        <Pencil className="size-4" />
      </button>
      {confirmDelete ? (
        <span className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            loading={remove.isPending}
            onClick={() => remove.mutate({ id: service.id })}
          >
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
            No
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Delete ${service.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}

function ProviderProfileForm({ profile }: { profile: ServiceProvider }) {
  const save = useUpdateProviderProfile();
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [visitFee, setVisitFee] = useState(
    profile.base_visit_fee != null ? String(profile.base_visit_fee) : "",
  );
  const [hourly, setHourly] = useState(
    profile.hourly_rate != null ? String(profile.hourly_rate) : "",
  );
  const [experience, setExperience] = useState(String(profile.experience_years ?? 0));
  const [areas, setAreas] = useState((profile.service_areas ?? []).join(", "));
  const [days, setDays] = useState<string[]>(profile.available_days ?? []);

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate({
      id: profile.id,
      patch: {
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        base_visit_fee: visitFee === "" ? null : Number(visitFee),
        hourly_rate: hourly === "" ? null : Number(hourly),
        experience_years: Number(experience) || 0,
        service_areas: areas
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        available_days: days,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Headline">
          <TextInput
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="10+ years in electrical repair"
          />
        </Field>
        <Field label="Experience (years)">
          <TextInput
            type="number"
            min="0"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </Field>
        <Field label="Base visit fee (₹)">
          <TextInput
            type="number"
            min="0"
            value={visitFee}
            onChange={(e) => setVisitFee(e.target.value)}
          />
        </Field>
        <Field label="Hourly rate (₹)">
          <TextInput
            type="number"
            min="0"
            value={hourly}
            onChange={(e) => setHourly(e.target.value)}
          />
        </Field>
      </div>

      <Field label="About you">
        <TextInput value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>

      <Field label="Service areas" hint="Comma-separated areas you cover in Latur.">
        <TextInput
          value={areas}
          onChange={(e) => setAreas(e.target.value)}
          placeholder="Ganj Golai, MIDC, Shivaji Nagar"
        />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-semibold">Available days</span>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => {
            const active = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="submit" loading={save.isPending}>
        Save profile
      </Button>
    </form>
  );
}

function ProviderDashboard() {
  const { data: profile, isLoading, isError, refetch } = useMyProviderProfile();
  const { data: bookings } = useProviderBookings(profile?.id);
  const { data: services } = useProviderServices(profile?.id);
  const { data: reviews } = useProviderReviews(profile?.id);
  const { data: categories } = useServiceCategories();
  const toggleOnline = useToggleProviderOnline();
  const updateStatus = useUpdateBookingStatus();
  const updateService = useUpdateService();
  const [tab, setTab] = useState<TabId>("overview");
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => bookings ?? [], [bookings]);
  const active = useMemo(() => list.filter(isActiveBooking), [list]);
  const pending = useMemo(() => list.filter((b) => b.status === "pending"), [list]);
  const completed = useMemo(() => list.filter((b) => b.status === "completed"), [list]);
  const reviewList = useMemo(() => reviews ?? [], [reviews]);

  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  const todayEarn = completed
    .filter((b) => dayKey(b.scheduled_date) === today)
    .reduce((sum, b) => sum + Number(b.amount), 0);
  const yesterdayEarn = completed
    .filter((b) => dayKey(b.scheduled_date) === yesterday)
    .reduce((sum, b) => sum + Number(b.amount), 0);
  const delta =
    yesterdayEarn > 0
      ? Math.round(((todayEarn - yesterdayEarn) / yesterdayEarn) * 100)
      : todayEarn > 0
        ? 100
        : 0;
  const totalEarned = completed.reduce((sum, b) => sum + Number(b.amount), 0);

  const performance = last7Days().map((day) => {
    const dayJobs = completed.filter((b) => dayKey(b.scheduled_date) === day.key);
    return {
      day: day.label,
      value: dayJobs.reduce((sum, b) => sum + Number(b.amount), 0),
      count: dayJobs.length,
    };
  });

  if (isLoading) return <LoadingState label="Loading your dashboard…" className="py-24" />;
  if (isError)
    return <ErrorState action={<Button onClick={() => void refetch()}>Try again</Button>} />;
  if (!profile)
    return (
      <EmptyState
        icon={Wrench}
        title="No provider profile yet"
        description="Your provider profile is created once your partner application is approved."
        action={
          <Link to="/partner/status">
            <Button>Check application status</Button>
          </Link>
        }
      />
    );

  const act = (id: string) => (status: BookingStatus) => updateStatus.mutate({ id, status });
  const rating = Number(profile.rating ?? 0);

  return (
    <PageShell>
      <div className={cn(container, "py-6 lg:py-8")}>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={profile.full_name} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">
                {profile.full_name}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                  <span className="size-1.5 rounded-full bg-primary" /> Live in {profile.city}
                </span>
                #{profile.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <OnlinePill
              online={profile.is_online}
              busy={toggleOnline.isPending}
              onToggle={() => toggleOnline.mutate({ id: profile.id, isOnline: !profile.is_online })}
            />
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Sidebar tab={tab} onTab={setTab} />

          <div className="min-w-0 space-y-6">
            {tab === "overview" && (
              <>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Welcome back, {profile.full_name.split(" ")[0]}
                    </h1>
                    <p className="mt-1 inline-flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {profile.is_verified && (
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <BadgeCheck className="size-4" aria-hidden="true" /> Verified Service
                          Partner
                        </span>
                      )}
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-4 fill-primary text-primary" aria-hidden="true" />
                        Rating: {rating.toFixed(1)}/5
                      </span>
                    </p>
                  </div>
                  <div className={cn(card, "flex items-center gap-3 p-4")}>
                    <Switch
                      on={profile.is_online}
                      disabled={toggleOnline.isPending}
                      label="Accepting new bookings"
                      onToggle={() =>
                        toggleOnline.mutate({ id: profile.id, isOnline: !profile.is_online })
                      }
                    />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        Global service status
                      </p>
                      <p className="text-sm font-semibold">
                        {profile.is_online ? "Accepting new bookings" : "Bookings paused"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand">
                    <span className="absolute -right-6 -top-6 grid size-24 place-items-center rounded-full bg-white/10">
                      <CalendarCheck className="size-6" aria-hidden="true" />
                    </span>
                    <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                      Active bookings
                    </p>
                    <p className="mt-2 font-display text-3xl font-extrabold">{active.length}</p>
                    <p className="mt-1 text-xs opacity-80">
                      {pending.length} waiting for your accept
                    </p>
                  </div>
                  <div className={cn(card, "p-5")}>
                    <div className="flex items-start justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        Today&apos;s earnings
                      </p>
                      <span className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
                        <IndianRupee className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-2 font-display text-3xl font-extrabold">{inr(todayEarn)}</p>
                    <p
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 text-xs font-bold",
                        delta >= 0 ? "text-primary" : "text-destructive",
                      )}
                    >
                      <TrendingUp className="size-3.5" aria-hidden="true" />
                      {Math.abs(delta)}% vs yesterday
                    </p>
                  </div>
                  <div className={cn(card, "p-5")}>
                    <div className="flex items-start justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        Pending leads
                      </p>
                      <span className="grid size-9 place-items-center rounded-xl bg-secondary text-foreground">
                        <UserPlus className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-2 inline-flex items-center gap-2 font-display text-3xl font-extrabold">
                      {pending.length}
                      {pending.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
                          <TriangleAlert className="size-3.5" aria-hidden="true" /> Action required
                        </span>
                      )}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${active.length ? Math.round((pending.length / active.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className={cn(card, "p-5")}>
                    <div className="flex items-start justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        Customer rating
                      </p>
                      <span className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
                        <Star className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-2 font-display text-3xl font-extrabold">
                      {rating.toFixed(1)}
                      <span className="text-sm font-semibold text-muted-foreground"> / 5</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on {reviewList.length} review{reviewList.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <section className={cn(card, "p-5 sm:p-6")}>
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-extrabold">Recent bookings</h2>
                      <Button variant="ghost" size="sm" onClick={() => setTab("bookings")}>
                        View all
                      </Button>
                    </div>
                    {list.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No bookings yet. Once customers book you, they appear here.
                      </p>
                    ) : (
                      <ul className="mt-4 grid gap-4">
                        {list.slice(0, 4).map((booking) => (
                          <BookingRow
                            key={booking.id}
                            booking={booking}
                            busy={updateStatus.isPending}
                            onAct={act(booking.id)}
                          />
                        ))}
                      </ul>
                    )}
                  </section>

                  <div className="space-y-6">
                    <section className={cn(card, "p-5")}>
                      <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold">
                        <Wrench className="size-5 text-primary" aria-hidden="true" /> Manage
                        services
                      </h2>
                      {!services || services.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No services listed yet.
                        </p>
                      ) : (
                        <ul className="mt-4 space-y-3">
                          {services.slice(0, 5).map((service) => (
                            <li
                              key={service.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="min-w-0 truncate text-sm font-semibold">
                                {service.name}
                              </span>
                              <Switch
                                on={service.is_active}
                                disabled={updateService.isPending}
                                label={`Toggle ${service.name}`}
                                onToggle={() =>
                                  updateService.mutate({
                                    id: service.id,
                                    patch: { is_active: !service.is_active },
                                  })
                                }
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => setTab("services")}
                      >
                        <Plus className="size-4" aria-hidden="true" /> Add or edit services
                      </Button>
                    </section>

                    <section className={cn(card, "p-5")}>
                      <h2 className="font-display text-lg font-extrabold">Activity feed</h2>
                      <ActivityFeed bookings={list} reviews={reviewList} />
                    </section>
                  </div>
                </div>
              </>
            )}

            {tab === "services" && (
              <section className={cn(card, "p-5 sm:p-6")}>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-extrabold">Your services</h2>
                  <Button size="sm" onClick={() => setAdding((v) => !v)}>
                    <Plus className="size-4" aria-hidden="true" />
                    {adding ? "Close" : "Add service"}
                  </Button>
                </div>
                <div className="mt-4">
                  {adding && (
                    <ServiceForm
                      providerId={profile.id}
                      categories={categories ?? []}
                      onDone={() => setAdding(false)}
                    />
                  )}
                  {!services || services.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      No services listed yet. Add a service so customers can book you.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {services.map((service) => (
                        <ServiceRow
                          key={service.id}
                          service={service}
                          providerId={profile.id}
                          categories={categories ?? []}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {tab === "bookings" && (
              <section className={cn(card, "p-5 sm:p-6")}>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-extrabold">Orders & bookings</h2>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {active.length} active · {completed.length} completed
                  </span>
                </div>
                {list.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
                ) : (
                  <ul className="mt-4 grid gap-4">
                    {list.map((booking) => (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        busy={updateStatus.isPending}
                        onAct={act(booking.id)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === "performance" && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className={cn(card, "p-5")}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Total earned
                    </p>
                    <p className="mt-2 font-display text-2xl font-extrabold">{inr(totalEarned)}</p>
                  </div>
                  <div className={cn(card, "p-5")}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Completed jobs
                    </p>
                    <p className="mt-2 font-display text-2xl font-extrabold">{completed.length}</p>
                  </div>
                  <div className={cn(card, "p-5")}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Jobs done (all time)
                    </p>
                    <p className="mt-2 font-display text-2xl font-extrabold">{profile.jobs_done}</p>
                  </div>
                </div>
                <PerformanceChart title="Earnings — last 7 days" data={performance} isMoney />
              </>
            )}

            {tab === "payouts" && <PayoutsPanel partnerId={profile.id} />}

            {tab === "settings" && (
              <section className={cn(card, "p-5 sm:p-6")}>
                <h2 className="font-display text-lg font-extrabold">Profile & availability</h2>
                <div className="mt-4">
                  <ProviderProfileForm key={profile.id} profile={profile} />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
