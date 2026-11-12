import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/nextnab/Button";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  email: string;
  /** "signup" verifies a new account, "email" verifies a passwordless login */
  purpose: "signup" | "email";
  onVerified: () => void;
  onBack: () => void;
  /** Overrides the default Supabase verify when NextNab emails its own codes. */
  verifyCode?: ((code: string) => Promise<void>) | undefined;
  resendCode?: (() => Promise<void>) | undefined;
  backLabel?: string;
};

export function OtpVerify({
  email,
  purpose,
  onVerified,
  onBack,
  verifyCode,
  resendCode,
  backLabel = "Use a different email",
}: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(45);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setBusy(true);
    try {
      if (verifyCode) {
        await verifyCode(code);
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: purpose,
        });
        if (error) throw error;
      }
      toast.success("Email verified");
      onVerified();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    try {
      if (resendCode) {
        await resendCode();
      } else if (purpose === "signup") {
        const { error } = await supabase.auth.resend({ type: "signup", email });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
      }
      setCooldown(45);
      toast.success("New code sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend the code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <MailCheck className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold">Verify your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-semibold">{email}</span>. Enter it below to
        continue.
      </p>

      <form onSubmit={verify} className="mt-6 space-y-4">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          aria-label="6-digit verification code"
          className="h-14 w-full rounded-2xl border border-border bg-card text-center font-display text-2xl font-extrabold tracking-[0.5em] outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-brand"
        />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Verify &amp; continue
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={resend}
          disabled={busy || cooldown > 0}
          className="font-semibold text-primary disabled:text-muted-foreground"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <button type="button" onClick={onBack} className="hover:text-foreground">
          {backLabel}
        </button>
      </div>

      <p className="mx-auto mt-4 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
        Not seeing the email? Check spam or promotions and allow a minute — mail providers throttle
        repeated codes.
      </p>
    </div>
  );
}
