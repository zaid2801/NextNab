import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, MapPin, Package, Star, Trash2, User, Wrench } from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { Field, TextInput, PhoneInput } from "@/components/nextnab/Form";
import { EmptyState, LoadingState } from "@/components/nextnab/States";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAddresses } from "@/hooks/useAddresses";
import { container, card } from "@/lib/design-system";

const title = "My account — NextNab";
const description =
  "Manage your NextNab profile and saved delivery addresses in Latur, and jump to your grocery orders and service bookings.";

export const Route = createFileRoute("/account")({
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
  component: AccountPage,
});

const emptyAddress = {
  label: "Home",
  contact_name: "",
  contact_phone: "",
  line1: "",
  line2: "",
  city: "Latur",
  state: "Maharashtra",
  pincode: "",
};

function AccountPage() {
  const { user, loading } = useAuth();
  const { profile, isLoading, save } = useProfile();
  const {
    addresses,
    isLoading: addressesLoading,
    addAddress,
    setDefault,
    removeAddress,
  } = useAddresses();

  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyAddress);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", phone: profile.phone ?? "" });
  }, [profile]);

  if (loading) {
    return (
      <PageShell>
        <LoadingState className="py-24" />
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className={`${container} py-20`}>
          <EmptyState
            icon={User}
            title="Sign in to see your account"
            description="Log in to manage your profile and saved delivery addresses."
            action={
              <Link to="/login">
                <Button>Login / Sign up</Button>
              </Link>
            }
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={`${container} space-y-8 py-10`}>
        <header>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            My account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </header>

        <div className="flex flex-wrap gap-3">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <Package className="size-4" /> My orders
            </Button>
          </Link>
          <Link to="/bookings">
            <Button variant="outline" size="sm">
              <Wrench className="size-4" /> My bookings
            </Button>
          </Link>
        </div>

        <section className={`${card} p-6`}>
          <h2 className="font-display text-xl font-bold">Personal details</h2>
          {isLoading ? (
            <LoadingState className="py-8" />
          ) : (
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate(form);
              }}
            >
              <Field label="Full name" required>
                <TextInput
                  icon={User}
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your name"
                  required
                />
              </Field>
              <Field label="Phone number" required>
                <PhoneInput
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="98xxxxxxxx"
                  required
                />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" loading={save.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </section>

        <section className={`${card} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Saved addresses</h2>
            <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
              <MapPin className="size-4" /> {showForm ? "Cancel" : "Add address"}
            </Button>
          </div>

          {showForm && (
            <form
              className="mt-5 grid gap-4 rounded-2xl bg-surface-low p-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                addAddress.mutate(
                  { ...draft, is_default: addresses.length === 0 },
                  {
                    onSuccess: () => {
                      setDraft(emptyAddress);
                      setShowForm(false);
                    },
                  },
                );
              }}
            >
              <Field label="Label" hint="Home, Work, Parents…">
                <TextInput
                  value={draft.label}
                  onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                />
              </Field>
              <Field label="Contact name" required>
                <TextInput
                  value={draft.contact_name}
                  onChange={(e) => setDraft((d) => ({ ...d, contact_name: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Contact phone" required>
                <PhoneInput
                  value={draft.contact_phone}
                  onChange={(e) => setDraft((d) => ({ ...d, contact_phone: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Pincode" required>
                <TextInput
                  value={draft.pincode}
                  onChange={(e) => setDraft((d) => ({ ...d, pincode: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Flat / house / street" required>
                <TextInput
                  value={draft.line1}
                  onChange={(e) => setDraft((d) => ({ ...d, line1: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Landmark / area">
                <TextInput
                  value={draft.line2}
                  onChange={(e) => setDraft((d) => ({ ...d, line2: e.target.value }))}
                />
              </Field>
              <Field label="City" required>
                <TextInput
                  value={draft.city}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  required
                />
              </Field>
              <Field label="State" required>
                <TextInput
                  value={draft.state}
                  onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
                  required
                />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" loading={addAddress.isPending}>
                  Save address
                </Button>
              </div>
            </form>
          )}

          {addressesLoading ? (
            <LoadingState className="py-8" />
          ) : addresses.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              No saved addresses yet — add one to check out faster.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <li key={address.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center gap-2">
                    <Home className="size-4 text-primary" aria-hidden="true" />
                    <span className="text-sm font-bold">{address.label}</span>
                    {address.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        <Star className="size-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold">{address.contact_name}</p>
                  <p className="text-sm text-muted-foreground">{address.contact_phone}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} –{" "}
                    {address.pincode}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefault.mutate(address.id)}
                        loading={setDefault.isPending}
                      >
                        Set as default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAddress.mutate(address.id)}
                      loading={removeAddress.isPending}
                    >
                      <Trash2 className="size-4" /> Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
