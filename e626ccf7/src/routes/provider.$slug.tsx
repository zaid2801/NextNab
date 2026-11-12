import { useState } from "react";
import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, CalendarDays, Clock, MapPin, Star, Wrench } from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { LoadingState, EmptyState } from "@/components/nextnab/States";
import { Field, TextInput, SelectInput } from "@/components/nextnab/Form";
import { useProvider } from "@/hooks/useCatalog";
import { useAddresses } from "@/hooks/useAddresses";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { container, card } from "@/lib/design-system";
import { inr } from "@/lib/format";
import type { PaymentMethod, ProviderDetail } from "@/types";

const TIME_SLOTS = [
  "09:00 - 11:00",
  "11:00 - 13:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
] as const;

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cod", label: "Pay after service (cash)" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

const title = "Service provider profile — NextNab Latur";
const description =
  "See ratings, experience, services and visit fee for a verified Latur professional, then book a convenient slot on NextNab.";

export const Route = createFileRoute("/provider/$slug")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProviderDetailPage,
});

function ProviderDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useProvider(slug);
  const { addresses } = useAddresses();
  const createBooking = useCreateBooking();

  const provider = (data ?? null) as ProviderDetail | null;
  const services = provider?.services ?? [];
  const reviews = provider?.reviews ?? [];

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<string>(TIME_SLOTS[0]);
  const [addressId, setAddressId] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cod");

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState label="Loading profile…" />
      </PageShell>
    );
  }

  if (!provider) {
    return (
      <PageShell>
        <div className={`${container} py-20`}>
          <EmptyState
            icon={Wrench}
            title="Professional not found"
            description="This profile may have been removed. Browse other verified professionals in Latur."
            action={
              <Link to="/home-services">
                <Button>Browse home services</Button>
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const visitFee = Number(provider.base_visit_fee ?? 0);
  const servicePrice = Number(selectedService?.price ?? 0);
  const total = visitFee + servicePrice;
  const selectedAddress = addresses.find((address) => address.id === addressId) ?? null;
  const serviceAddress = selectedAddress
    ? [selectedAddress.line1, selectedAddress.line2, selectedAddress.city, selectedAddress.pincode]
        .filter(Boolean)
        .join(", ")
    : manualAddress.trim();

  const missing = [
    services.length > 0 && !selectedService ? "a service" : null,
    !date ? "a preferred date" : null,
    !slot ? "a time slot" : null,
    !serviceAddress ? "a service address" : null,
    !method ? "a payment method" : null,
  ].filter(Boolean) as string[];

  function submit() {
    if (!provider || createBooking.isPending) return;
    if (missing.length > 0) {
      toast.error(`Please select ${missing.join(", ")}.`);
      return;
    }
    createBooking.mutate(
      {
        providerId: provider.id,
        serviceId: selectedService?.id ?? null,
        serviceName: selectedService?.name ?? provider.category?.name ?? "Home service visit",
        addressId: selectedAddress?.id ?? null,
        serviceAddress,
        scheduledDate: date,
        timeSlot: slot,
        visitingFee: visitFee,
        amount: total,
        method,
      },
      { onSuccess: () => void navigate({ to: "/bookings" }) },
    );
  }

  return (
    <PageShell>
      <div className={`${container} grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-12`}>
        <div className="space-y-6">
          <section className={`${card} p-6`}>
            <div className="flex gap-4">
              <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                {provider.avatar_url ? (
                  <img
                    src={provider.avatar_url}
                    alt={provider.full_name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center font-display text-2xl font-bold text-muted-foreground/60">
                    {provider.full_name.slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate font-display text-2xl font-extrabold tracking-tight">
                    {provider.full_name}
                  </h1>
                  {provider.is_verified && <BadgeCheck className="size-5 shrink-0 text-primary" />}
                </div>
                <p className="text-sm font-semibold text-primary">{provider.category?.name}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Star className="size-4 fill-current text-brand" />
                    {Number(provider.rating).toFixed(1)}
                  </span>
                  <span>{provider.jobs_done}+ jobs done</span>
                  <span>{provider.experience_years} yrs experience</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-4" /> {provider.city}
                  </span>
                </div>
              </div>
            </div>
            {provider.bio && <p className="mt-5 text-sm text-muted-foreground">{provider.bio}</p>}
          </section>

          <section className={`${card} p-6`}>
            <h2 className="font-display text-lg font-extrabold">Services &amp; pricing</h2>
            {services.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                This professional charges a visit fee of {inr(visitFee)}; final pricing is shared
                after inspection.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {services.map((service) => (
                  <li key={service.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                    <p className="shrink-0 font-display font-extrabold">{inr(service.price)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {reviews.length > 0 && (
            <section className={`${card} p-6`}>
              <h2 className="font-display text-lg font-extrabold">Customer reviews</h2>
              <ul className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-2xl bg-surface-low p-4">
                    <span className="inline-flex items-center gap-1 text-sm font-bold">
                      <Star className="size-4 fill-current text-brand" /> {review.rating}
                    </span>
                    {review.comment && (
                      <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className={`${card} h-fit p-6 lg:sticky lg:top-24`}>
          <h2 className="font-display text-lg font-extrabold">Book a visit</h2>

          {!user ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in to book {provider.full_name.split(" ")[0]} for a home visit.
              </p>
              <Link to="/login" className="block">
                <Button className="w-full">Login / Sign up</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {services.length > 0 && (
                <Field label="Service">
                  <SelectInput
                    value={serviceId}
                    placeholder="Inspection visit only"
                    options={services.map((service) => service.name)}
                    onChange={(event) => {
                      const match = services.find((service) => service.name === event.target.value);
                      setServiceId(match?.id ?? "");
                    }}
                  />
                </Field>
              )}

              <Field label="Preferred date" required>
                <TextInput
                  type="date"
                  icon={CalendarDays}
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                  <Clock className="size-4 text-primary" /> Time slot
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSlot(option)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        slot === option
                          ? "bg-primary text-primary-foreground shadow-brand"
                          : "border border-border bg-card text-muted-foreground hover:border-brand hover:text-primary"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {addresses.length > 0 ? (
                <Field label="Service address" required>
                  <SelectInput
                    value={selectedAddress?.label ?? ""}
                    placeholder="Choose a saved address"
                    options={addresses.map((address) => address.label)}
                    onChange={(event) => {
                      const match = addresses.find(
                        (address) => address.label === event.target.value,
                      );
                      setAddressId(match?.id ?? "");
                    }}
                  />
                </Field>
              ) : (
                <Field label="Service address" required hint="House / street, area, Latur">
                  <TextInput
                    icon={MapPin}
                    value={manualAddress}
                    onChange={(event) => setManualAddress(event.target.value)}
                    placeholder="Flat 3, Shivaji Nagar, Latur"
                  />
                </Field>
              )}

              <Field label="Payment">
                <SelectInput
                  value={PAYMENT_OPTIONS.find((option) => option.value === method)?.label ?? ""}
                  options={PAYMENT_OPTIONS.map((option) => option.label)}
                  onChange={(event) => {
                    const match = PAYMENT_OPTIONS.find(
                      (option) => option.label === event.target.value,
                    );
                    setMethod(match?.value ?? "cod");
                  }}
                />
              </Field>

              <dl className="space-y-2 rounded-2xl bg-surface-low p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Visit fee</dt>
                  <dd className="font-semibold">{inr(visitFee)}</dd>
                </div>
                {selectedService && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{selectedService.name}</dt>
                    <dd className="font-semibold">{inr(servicePrice)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 font-display font-extrabold">
                  <dt>Estimated total</dt>
                  <dd>{inr(total)}</dd>
                </div>
              </dl>

              <Button className="w-full" loading={createBooking.isPending} onClick={submit}>
                Request booking
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Final charges may vary based on parts and work required.
              </p>
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
