import groceriesImage from "@/assets/groceries.jpg";
import { Logo } from "./Logo";

const swatches = ["bg-accent", "bg-[#f3e6d4]", "bg-[#d9f2e4]", "bg-[#f8dcdc]"];

/** Decorative app preview shown beside the hero copy. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="rounded-[2.75rem] border-[10px] border-ink bg-card p-3 shadow-[0_30px_70px_-20px_rgb(83_0_183/0.4)]">
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-ink/80" />

        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            N
          </span>
          <span className="h-2 flex-1 rounded-full bg-surface-container" />
          <span className="size-6 rounded-full bg-surface-container" />
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-border/70">
          <img
            src={groceriesImage}
            alt="NextNab app grocery collection preview"
            width={1024}
            height={768}
            className="h-32 w-full object-cover"
          />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {swatches.map((swatch) => (
            <span key={swatch} className={`h-9 rounded-xl ${swatch}`} />
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-surface-low p-3">
          <span className="block h-2 w-24 rounded-full bg-surface-container" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <span className="h-24 rounded-xl bg-[#e4e9fb]" />
            <span className="h-24 rounded-xl bg-[#e4e9fb]" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border/70 px-3 py-2">
          <Logo showWordmark={false} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            20-min delivery
          </span>
        </div>
      </div>
    </div>
  );
}
