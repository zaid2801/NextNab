import { Apple, Play } from "lucide-react";
import { cn } from "@/lib/utils";

function StoreBadge({
  icon,
  caption,
  name,
}: {
  icon: React.ReactNode;
  caption: string;
  name: string;
}) {
  return (
    <a
      href="#"
      onClick={(event) => event.preventDefault()}
      className="inline-flex items-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 text-white transition-transform duration-200 hover:-translate-y-0.5"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[9px] uppercase tracking-wide text-white/70">{caption}</span>
        <span className="font-display text-sm font-bold">{name}</span>
      </span>
    </a>
  );
}

export function AppDownloadButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <StoreBadge icon={<Apple className="size-5" />} caption="Download on" name="App Store" />
      <StoreBadge icon={<Play className="size-5" />} caption="Get it on" name="Google Play" />
    </div>
  );
}
