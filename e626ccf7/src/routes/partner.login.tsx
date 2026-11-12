import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, LogIn, Zap } from "lucide-react";
import { toast } from "sonner";
import markAsset from "@/assets/nextnab-mark.png";
import { Logo } from "@/components/nextnab/Logo";
import { Button } from "@/components/nextnab/Button";
import { OtpVerify } from "@/components/nextnab/OtpVerify";
import { PartnerShell } from "@/components/nextnab/PartnerShell";
import { useAuth } from "@/hooks/useAuth";
import { requestPartnerOtp, verifyPartnerOtp } from "@/integrations/email/server";
import { isValidPhone } from "@/lib/partner-options";
import { cn } from "@/lib/utils";

const title = "Partner login — NextNab";
const description =
  "Sign in to your NextNab partner account to manage your store, services or deliveries in Latur.";

export const Route = createFileRoute("/partner/login")({
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
  component: PartnerLoginPage,
});

const ROLES = [
  { id: "shopkeeper", label: "Shopkeeper", home: "/merchant" },
  { id: "service_provider", label: "Service Provider", home: "/provider" },
  { id: "rider", label: "Rider", home: "/rider" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

function GoogleIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        fill="#EA4335"
      />
      <path
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        fill="#4285F4"
      />
      <path
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        fill="#FBBC05"
      />
      <path
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        fill="#34A853"
      />
    </svg>
  );
}

function HeroPanel() {
  return (
    <aside className="relative hidden md:block">
      <img
        src="/delivery-hero.png"
        alt="NextNab delivery partner on the streets of Latur"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-10 text-primary-foreground">
        <h2 className="font-display text-3xl font-extrabold">Instant Relief, Delivered.</h2>
        <p className="mt-2 text-base text-primary-foreground/85">
          Everything you need in Latur, right at your doorstep.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/20 px-4 py-2 text-xs font-semibold backdrop-blur-md">
            <BadgeCheck className="size-4" aria-hidden="true" /> Verified Local Partners
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/20 px-4 py-2 text-xs font-semibold backdrop-blur-md">
            <Zap className="size-4" aria-hidden="true" /> Hyperlocal Speed
          </span>
        </div>
      </div>
    </aside>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 lg:px-12">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Already have an account?
            </span>
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </header>
      <main className="flex min-h-screen items-center justify-center px-4 pb-12 pt-24">
        <div className="grid w-full max-w-[1000px] overflow-hidden rounded-3xl bg-card shadow-card-hover md:grid-cols-2">
          <HeroPanel />
          <section className="flex flex-col justify-center p-6 md:p-12">{children}</section>
        </div>
      </main>
    </div>
  );
}

function PartnerLoginPage() {
  const [role, setRole] = useState<RoleId>("shopkeeper");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const redirectingRef = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = (ROLES.find((option) => option.id === role) ?? ROLES[0]).home;

  if (user) {
    return (
      <PartnerShell icon={LogIn} title="You're signed in" subtitle={user.email ?? undefined}>
        <p className="text-center text-sm text-muted-foreground">
          Continue with your partner application, or open your dashboard if you're already approved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/partner/status">
            <Button>Application status</Button>
          </Link>
          <Link to="/partner">
            <Button variant="outline">Partner home</Button>
          </Link>
        </div>
      </PartnerShell>
    );
  }

  if (maskedEmail) {
    return (
      <PageFrame>
        <OtpVerify
          email={maskedEmail}
          purpose="email"
          backLabel="Use a different number"
          onVerified={() => {
            // The magic-link redirect already owns navigation; a router push
            // here would race the full-page load and strand the user.
            if (!redirectingRef.current) void navigate({ to: home });
          }}
          onBack={() => setMaskedEmail(null)}
          verifyCode={async (code) => {
            const result = await verifyPartnerOtp({
              data: {
                phone,
                role,
                code,
                redirectTo: `${window.location.origin}${home}`,
              },
            });
            if (result.actionLink) {
              redirectingRef.current = true;
              window.location.assign(result.actionLink);
            }
          }}
          resendCode={async () => {
            const result = await requestPartnerOtp({ data: { phone, role } });
            if (!result.sent) throw new Error(result.error ?? "Could not resend the code");
          }}
        />
      </PageFrame>
    );
  }

  async function getOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setBusy(true);
    try {
      const result = await requestPartnerOtp({ data: { phone, role } });
      if (!result.available) {
        toast.error("OTP service is not configured on this server yet");
        return;
      }
      if (!result.sent) {
        toast.error(result.error ?? "Could not send the code right now");
        return;
      }
      setMaskedEmail(result.maskedEmail ?? "your registered email");
      toast.success("Code sent to your registered email");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageFrame>
      <div className="mb-8 h-32 overflow-hidden rounded-xl shadow-soft md:hidden">
        <img src="/delivery-hero.png" alt="" className="size-full object-cover" />
      </div>

      <div className="mb-8">
        <div className="mb-4 grid size-16 place-items-center rounded-xl bg-background shadow-soft">
          <img src={markAsset} alt="NextNab logo" className="size-9 object-contain" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Welcome Back, Partner
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select your role and enter your phone number to access your partner account.
        </p>
      </div>

      <div
        className="mb-6 flex w-full rounded-xl bg-surface-container p-1"
        role="tablist"
        aria-label="Partner role"
      >
        {ROLES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={role === option.id}
            onClick={() => setRole(option.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-all",
              role === option.id
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:bg-surface-low",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={getOtp} className="flex flex-col gap-4">
        <div className="relative">
          <input
            id="partner-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder=" "
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            className="peer w-full rounded-xl bg-surface-low px-4 pb-3 pt-7 text-foreground shadow-soft outline-none transition-colors focus:bg-surface-container"
          />
          <label
            htmlFor="partner-phone"
            className="pointer-events-none absolute left-4 top-5 origin-left text-muted-foreground transition-all peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary"
          >
            Phone Number
          </label>
        </div>
        <Button type="submit" size="lg" className="group w-full py-4" loading={busy}>
          Get OTP
          <ArrowRight
            className="size-5 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Button>
      </form>

      <div className="relative my-8 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="h-px w-full bg-border" />
        </div>
        <span className="relative bg-card px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Or continue with
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full py-4"
        onClick={() =>
          toast.message("Google sign-in for partners is coming soon — use the OTP above")
        }
      >
        <GoogleIcon />
        Google
      </Button>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          New to NextNab?{" "}
          <Link to="/partner/join" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </PageFrame>
  );
}
