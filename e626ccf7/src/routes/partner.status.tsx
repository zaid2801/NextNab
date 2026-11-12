import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  ClipboardCheck,
  Clock,
  Compass,
  Hourglass,
  Store,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/nextnab/States";
import { usePartnerApplications } from "@/hooks/usePartner";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";
import { card, container } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, PartnerApplication, PartnerType } from "@/types";

const title = "Partner application status — NextNab";
const description = "Track the review status of your NextNab partner application for Latur.";

export const Route = createFileRoute("/partner/status")({
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
  component: PartnerStatusPage,
});

const TYPE_META: Record<PartnerType, { label: string; icon: LucideIcon }> = {
  shopkeeper: { label: "Shopkeeper", icon: Store },
  service_provider: { label: "Service provider", icon: Wrench },
  rider: { label: "Delivery rider", icon: Bike },
};

const STATUS_TEXT: Record<ApplicationStatus, { label: string; tone: string; note: string }> = {
  draft: {
    label: "Draft",
    tone: "bg-secondary text-muted-foreground",
    note: "This application is not submitted yet. Finish the remaining steps to send it for review.",
  },
  submitted: {
    label: "Submitted",
    tone: "bg-accent text-primary",
    note: "We have received your application. Our Latur team usually reviews within 24–48 hours.",
  },
  under_review: {
    label: "Under review",
    tone: "bg-accent text-primary",
    note: "Our team is verifying your details and documents. We will call you if anything is missing.",
  },
  approved: {
    label: "Approved",
    tone: "bg-primary/15 text-primary",
    note: "Congratulations — your partner account is active. Open your dashboard to start working.",
  },
  rejected: {
    label: "Not approved",
    tone: "bg-destructive/10 text-destructive",
    note: "This application was not approved. You can apply again with corrected details or documents.",
  },
};

const NEXT_STEPS = [
  {
    title: "Profile Verification",
    description: "We are checking your documents and business details for quality assurance.",
  },
  {
    title: "Account Activation",
    description: "Once verified, you'll receive a notification to start accepting bookings.",
  },
  {
    title: "Start Earning",
    description: "Set up your dashboard and get your first lead in Latur!",
  },
];

function NextStepsPanel({ status }: { status: ApplicationStatus }) {
  if (status === "rejected" || status === "draft") return null;
  const activeIndex = status === "approved" ? 2 : 0;

  return (
    <div className="mt-5 rounded-3xl bg-gradient-to-r from-secondary to-[#d9f2e4] p-6 sm:p-7">
      <h3 className="inline-flex items-center gap-2 font-display text-base font-extrabold">
        <Compass className="size-4 text-[#006c49]" aria-hidden="true" /> What happens next?
      </h3>
      <ol className="relative mt-6 grid gap-8 sm:grid-cols-3 sm:gap-4">
        <span
          className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-2.5 hidden h-px bg-border sm:block"
          aria-hidden="true"
        />
        {NEXT_STEPS.map((step, index) => {
          const done = index < activeIndex || status === "approved";
          const active = index === activeIndex && status !== "approved";
          return (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              <span
                className={cn(
                  "relative z-10 grid size-5 place-items-center rounded-full",
                  done || active ? "bg-primary" : "bg-card border border-border",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    done || active ? "bg-primary-foreground" : "bg-border",
                  )}
                />
              </span>
              <p
                className={cn(
                  "mt-3 text-[11px] font-bold uppercase tracking-widest",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                Step {index + 1}
              </p>
              <p className="mt-1 font-display text-base font-extrabold">{step.title}</p>
              <p className="mt-2 max-w-[220px] text-sm text-muted-foreground">{step.description}</p>
              {active && (
                <span className="mt-3 rounded-full bg-card px-3 py-1 text-[11px] font-bold text-muted-foreground shadow-soft">
                  In Progress
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DashboardLink({ type }: { type: PartnerType }) {
  if (type === "shopkeeper") {
    return (
      <Link to="/merchant">
        <Button>Open merchant dashboard</Button>
      </Link>
    );
  }
  if (type === "service_provider") {
    return (
      <Link to="/provider">
        <Button>Open provider dashboard</Button>
      </Link>
    );
  }
  return (
    <Link to="/rider">
      <Button>Open rider dashboard</Button>
    </Link>
  );
}

function ApplicationCard({ application }: { application: PartnerApplication }) {
  const meta = TYPE_META[application.partner_type];
  const status = STATUS_TEXT[application.status];
  const Icon = meta.icon;

  return (
    <article className={cn(card, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-accent text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold">{meta.label} application</h2>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            Applied {formatDate(application.submitted_at ?? application.created_at)}
          </p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", status.tone)}>
          {status.label}
        </span>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{status.note}</p>

      <NextStepsPanel status={application.status} />

      <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">Name</dt>
          <dd className="font-semibold">{application.full_name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">Mobile</dt>
          <dd className="font-semibold">+91 {application.phone}</dd>
        </div>
        {application.business_name && (
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">Business</dt>
            <dd className="font-semibold">{application.business_name}</dd>
          </div>
        )}
        {application.service_category && (
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">Service</dt>
            <dd className="font-semibold">{application.service_category}</dd>
          </div>
        )}
        {application.vehicle_type && (
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">Vehicle</dt>
            <dd className="font-semibold">
              {application.vehicle_type}
              {application.vehicle_number ? ` · ${application.vehicle_number}` : ""}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-semibold text-muted-foreground">City</dt>
          <dd className="font-semibold">{application.city}</dd>
        </div>
      </dl>

      {application.status === "rejected" && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {application.review_note ??
            "Our team could not verify your details. Please apply again with correct documents, or call us for help."}
        </p>
      )}

      {application.status !== "rejected" && application.review_note && (
        <p className="mt-4 rounded-2xl bg-secondary p-4 text-sm">
          <span className="font-bold">Note from our team: </span>
          {application.review_note}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {application.status === "approved" && <DashboardLink type={application.partner_type} />}
        {(application.status === "rejected" || application.status === "draft") && (
          <Link to="/partner/join" search={{ type: application.partner_type }}>
            <Button>Apply again</Button>
          </Link>
        )}
      </div>
    </article>
  );
}

function PartnerStatusPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, isError, refetch } = usePartnerApplications();
  const underReview = (data ?? []).some(
    (application) => application.status === "submitted" || application.status === "under_review",
  );

  return (
    <PageShell>
      <div className={`${container} py-10 lg:py-14`}>
        {underReview ? (
          <header className="mx-auto max-w-2xl text-center">
            <span className="mx-auto grid size-24 place-items-center rounded-full bg-accent">
              <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-brand">
                <Hourglass className="size-7" aria-hidden="true" />
              </span>
            </span>
            <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Application Under Review
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Thank you for joining NextNab! Our team is currently verifying your details. This
              usually takes <span className="font-bold text-primary">24-48 hours</span>. We&rsquo;re
              excited to partner with you.
            </p>
          </header>
        ) : (
          <header className="max-w-2xl">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Application status
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Track where your NextNab partner application stands. We also email and call you on
              every update.
            </p>
          </header>
        )}

        <div className="mt-8">
          {authLoading || (user && isLoading) ? (
            <LoadingState label="Loading your applications…" />
          ) : !user ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Partner login required"
              description="Sign in with your partner account to see your application status."
              action={
                <Link to="/partner/login">
                  <Button>Partner login</Button>
                </Link>
              }
            />
          ) : isError ? (
            <ErrorState action={<Button onClick={() => void refetch()}>Try again</Button>} />
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No application yet"
              description="You haven't applied to become a NextNab partner. It only takes a few minutes."
              action={
                <Link to="/partner">
                  <Button>Become a partner</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {data.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
