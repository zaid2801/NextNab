import { useEffect, useState } from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Processing Payment", progress: 25 },
  { label: "Verifying Details", progress: 50 },
  { label: "Almost There", progress: 85 },
  { label: "Payment Successful", progress: 100 },
] as const;

const RING = 2 * Math.PI * 54;

export function ProcessingPayment({
  amount,
  onComplete,
}: {
  amount: number;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const done = step === STEPS.length - 1;

  useEffect(() => {
    if (done) {
      const t = setTimeout(onComplete, 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, done, onComplete]);

  const current = STEPS[Math.min(step, STEPS.length - 1)] ?? STEPS[0];
  const progress = current.progress;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-md px-6 text-center">
        <div className="relative mx-auto size-40">
          <svg viewBox="0 0 120 120" className="size-40 -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-border" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(
                "transition-all duration-700",
                done ? "stroke-green-500" : "stroke-primary",
              )}
              strokeDasharray={RING}
              strokeDashoffset={RING - (RING * progress) / 100}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            {done ? (
              <CheckCircle2 className="size-12 text-green-500" />
            ) : (
              <span className="relative grid size-14 place-items-center rounded-full bg-accent">
                <Lock className="size-6 text-primary" />
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              </span>
            )}
          </div>
        </div>

        <h1 className="mt-8 font-display text-2xl font-extrabold tracking-tight">
          {current.label}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Amount {inr(amount)} · Merchant NextNab Latur
        </p>

        {!done ? (
          <>
            <div className="mt-8 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-2 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-error/10 px-4 py-2 text-xs font-semibold text-error">
              Please do not refresh or close this page
            </p>
          </>
        ) : (
          <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-600">
            <ShieldCheck className="size-4" /> Payment confirmed — placing your order
          </p>
        )}
      </div>
    </div>
  );
}
