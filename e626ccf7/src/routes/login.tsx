import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/nextnab/PageShell";
import { Button } from "@/components/nextnab/Button";
import { OtpVerify } from "@/components/nextnab/OtpVerify";
import { supabase } from "@/integrations/supabase/client";
import { getEmailAuthConfig, requestEmailOtp, verifyEmailOtp } from "@/integrations/email/server";
import { useAuth } from "@/hooks/useAuth";
import { card, container } from "@/lib/design-system";

const title = "Login or Sign Up — NextNab";
const description =
  "Sign in to NextNab to order groceries, book trusted home services and track deliveries in Latur.";

export const Route = createFileRoute("/login")({
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
  component: LoginPage,
});

const field =
  "h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand";

const AUTH_TIMEOUT_MS = 20_000;

// Auth calls can hang silently on a dead network or stale dev server; race them
// so the button always recovers with an actionable message.
function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `${label}: server se response nahi mila. Connection check karke dobara try karo.`,
          ),
        );
      }, AUTH_TIMEOUT_MS);
    }),
  ]);
}

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<"signup" | "email" | null>(null);
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [otpTransport, setOtpTransport] = useState<"nextnab" | "supabase">("supabase");
  const [inbox, setInbox] = useState<"signup" | "magiclink" | null>(null);
  const [otpEmailAvailable, setOtpEmailAvailable] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const redirectingRef = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getEmailAuthConfig()
      .then((config) => setOtpEmailAvailable(config.otpEmail))
      .catch(() => setOtpEmailAvailable(false));
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setOtpPurpose(null);
        setResetSent(false);
        setPassword("");
        setMode("reset");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (user) {
    return (
      <PageShell>
        <div className={`${container} py-20 text-center`}>
          <h1 className="font-display text-3xl font-extrabold">You're signed in</h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/groceries">
              <Button>Shop groceries</Button>
            </Link>
            <Link to="/orders">
              <Button variant="outline">My orders</Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await withTimeout(
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
          }),
          "Reset link",
        );
        if (error) throw error;
        setResetSent(true);
        toast.success("Password reset link sent — check your email");
      } else if (mode === "reset") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        const { error } = await withTimeout(
          supabase.auth.updateUser({ password }),
          "Password update",
        );
        if (error) throw error;
        toast.success("Password updated");
        setMode("signin");
        setPassword("");
        navigate({ to: "/groceries" });
      } else if (mode === "signin") {
        if (useOtpLogin) {
          const otp = await withTimeout(
            requestEmailOtp({ data: { email, purpose: "email" } }),
            "Login code request",
          );
          if (otp.sent) {
            setOtpTransport("nextnab");
            setOtpPurpose("email");
          } else {
            if (otp.error) toast.error(`Code email failed: ${otp.error}`);
            const { error } = await withTimeout(
              supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false },
              }),
              "Sign-in link",
            );
            if (error) throw error;
            setInbox("magiclink");
          }
        } else {
          const { error } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            "Login",
          );
          if (error) throw error;
          toast.success("Welcome back to NextNab");
          navigate({ to: "/groceries" });
        }
      } else {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { full_name: fullName, phone, role: "customer" },
            },
          }),
          "Sign up",
        );
        if (error) throw error;
        if (data.session) {
          toast.success("Account created successfully");
          navigate({ to: "/account" });
        } else {
          toast.success("Account created successfully — ab email me aaya code daalo");
          const otp = await withTimeout(
            requestEmailOtp({ data: { email, purpose: "signup" } }),
            "Verification code request",
          );
          if (otp.sent) {
            setOtpUserId(data.user?.id ?? null);
            setOtpTransport("nextnab");
            setOtpPurpose("signup");
          } else {
            if (otp.error) toast.error(`Code email failed: ${otp.error}`);
            // Supabase also emailed a confirmation link during signUp.
            setInbox("signup");
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <div className={`${container} flex justify-center py-14 sm:py-20`}>
        <div className={`${card} w-full max-w-md p-7 sm:p-9`}>
          {inbox ? (
            <div className="text-center">
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                <Mail className="size-7" aria-hidden="true" />
              </div>
              <h1 className="font-display text-2xl font-extrabold">
                {inbox === "signup" ? "Confirm your email" : "Check your inbox"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {inbox === "signup" ? (
                  <>
                    We sent a confirmation link to{" "}
                    <span className="font-semibold text-foreground">{email}</span>. Open it (check
                    Spam/Promotions too), tap the link, then sign in with your password.
                  </>
                ) : (
                  <>
                    We sent a sign-in link to{" "}
                    <span className="font-semibold text-foreground">{email}</span>. Open it (check
                    Spam/Promotions too) — tapping it signs you in automatically.
                  </>
                )}
              </p>
              <div className="mt-6 space-y-2.5">
                {inbox === "signup" && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setInbox(null);
                      setOtpPurpose(null);
                      setMode("signin");
                    }}
                  >
                    I confirmed — sign in now
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  loading={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      if (inbox === "signup") {
                        const { error } = await withTimeout(
                          supabase.auth.resend({
                            type: "signup",
                            email,
                          }),
                          "Resend",
                        );
                        if (error) throw error;
                      } else {
                        const { error } = await withTimeout(
                          supabase.auth.signInWithOtp({
                            email,
                            options: { shouldCreateUser: false },
                          }),
                          "Resend",
                        );
                        if (error) throw error;
                      }
                      toast.success("Email bhej diya — inbox check karein");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Something went wrong");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Resend email
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setInbox(null)}>
                  Back
                </Button>
              </div>
            </div>
          ) : otpPurpose ? (
            <OtpVerify
              email={email}
              purpose={otpPurpose}
              onVerified={() => {
                // A magic-link redirect already owns the navigation; a router
                // push here would race the full-page load and strand the user.
                if (!redirectingRef.current) navigate({ to: "/account" });
              }}
              onBack={() => setOtpPurpose(null)}
              verifyCode={
                otpTransport === "nextnab"
                  ? async (code) => {
                      const result = await withTimeout(
                        verifyEmailOtp({
                          data: {
                            email,
                            purpose: otpPurpose,
                            code,
                            userId: otpUserId ?? undefined,
                            redirectTo: `${window.location.origin}/account`,
                          },
                        }),
                        "Code verification",
                      );
                      if (otpPurpose === "signup") {
                        const { error } = await withTimeout(
                          supabase.auth.signInWithPassword({
                            email,
                            password,
                          }),
                          "Sign in after verification",
                        );
                        if (error) {
                          // Email is verified at this point; a password mismatch
                          // means the account existed before this signup attempt.
                          setOtpPurpose(null);
                          setMode("signin");
                          toast.message("Email verified — ab apne password se sign in karo");
                          return;
                        }
                      } else if (result.actionLink) {
                        redirectingRef.current = true;
                        window.location.assign(result.actionLink);
                      }
                    }
                  : undefined
              }
              resendCode={
                otpTransport === "nextnab"
                  ? async () => {
                      const otp = await withTimeout(
                        requestEmailOtp({
                          data: { email, purpose: otpPurpose },
                        }),
                        "New code request",
                      );
                      if (!otp.sent && otpPurpose === "email") {
                        const { error } = await withTimeout(
                          supabase.auth.signInWithOtp({
                            email,
                            options: { shouldCreateUser: false },
                          }),
                          "Sign-in link",
                        );
                        if (error) throw error;
                      }
                    }
                  : undefined
              }
            />
          ) : mode === "reset" ? (
            <>
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                <KeyRound className="size-7" aria-hidden="true" />
              </div>
              <h1 className="font-display text-2xl font-extrabold">Set a new password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Choose a strong password you haven&apos;t used before.
              </p>
              <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                  <input
                    className={field}
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    autoFocus
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="mt-2 w-full" loading={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </>
          ) : mode === "forgot" ? (
            resetSent ? (
              <div className="text-center">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                  <Mail className="size-7" aria-hidden="true" />
                </div>
                <h1 className="font-display text-2xl font-extrabold">Check your email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a password reset link to{" "}
                  <span className="font-semibold text-foreground">{email}</span>. Click it to choose
                  a new password.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 w-full"
                  onClick={() => {
                    setResetSent(false);
                    setMode("signin");
                  }}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <>
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
                  <KeyRound className="size-7" aria-hidden="true" />
                </div>
                <h1 className="font-display text-2xl font-extrabold">Forgot password?</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a link to reset it.
                </p>
                <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                    <input
                      className={field}
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="mt-2 w-full" loading={busy}>
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    Send reset link
                  </Button>
                </form>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="mt-4 w-full text-center text-xs font-semibold text-primary"
                >
                  Back to login
                </button>
              </>
            )
          ) : (
            <>
              <div className="mb-7 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
                {(["signin", "signup"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={`h-10 rounded-full text-sm font-bold transition-colors ${
                      mode === value
                        ? "bg-card text-primary shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {value === "signin" ? "Login" : "Sign up"}
                  </button>
                ))}
              </div>

              <h1 className="font-display text-2xl font-extrabold">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to track orders and bookings across Latur."
                  : otpEmailAvailable
                    ? "Verify your email with a 6-digit code and start ordering."
                    : "Create your account, confirm your email, then start ordering."}
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                {mode === "signup" && (
                  <>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                      <input
                        className={field}
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                      <input
                        className={field}
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                  <input
                    className={field}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {!(mode === "signin" && useOtpLogin) && (
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground" />
                    <input
                      className={field}
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                )}

                {mode === "signin" && !useOtpLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setResetSent(false);
                        setMode("forgot");
                      }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" size="lg" className="mt-2 w-full" loading={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {mode === "signup" ? "Create account" : useOtpLogin ? "Send login code" : "Login"}
                </Button>
              </form>

              {mode === "signin" && otpEmailAvailable && (
                <button
                  type="button"
                  onClick={() => setUseOtpLogin((value) => !value)}
                  className="mt-4 w-full text-center text-xs font-semibold text-primary"
                >
                  {useOtpLogin ? "Use password instead" : "Login with an email code instead"}
                </button>
              )}

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Are you a shop, professional or rider?{" "}
                <Link to="/partner" className="font-semibold text-primary">
                  Partner with NextNab
                </Link>
              </p>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Need help?{" "}
                <Link to="/help" className="font-semibold text-primary">
                  Visit the Help Center
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
