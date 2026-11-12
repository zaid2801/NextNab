import { useNavigate } from "@tanstack/react-router";
import { AppDownloadButtons } from "./AppDownloadButtons";
import { PhoneMockup } from "./PhoneMockup";
import { SearchBar } from "./SearchBar";
import { container, pill } from "@/lib/design-system";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pt-16 lg:pb-24">
      <span className="brand-blob animate-float-slow left-1/2 top-0 size-[420px] rounded-full bg-accent" />
      <span className="brand-blob right-0 top-24 size-[360px] rounded-full bg-[#dfe7ff]" />

      <div className={`${container} relative grid items-center gap-12 lg:grid-cols-2`}>
        <div>
          <span className={pill}>
            <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
            Now live in Latur
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            20-min delivery + <span className="text-gradient-animated">trusted home services.</span>
          </h1>

          <p className="mt-5 max-w-md text-base text-muted-foreground">
            From fresh groceries to reliable plumbers. NextNab connects you to Latur&rsquo;s best
            local providers instantly.
          </p>

          <div className="mt-8">
            <SearchBar
              onSearch={(query) => {
                void navigate({ to: "/search", search: { q: query, mode: "grocery" } });
              }}
            />
          </div>

          <AppDownloadButtons className="mt-7" />
        </div>

        <div className="relative">
          <span
            aria-hidden="true"
            className="animate-nn-float absolute -left-2 top-8 z-10 hidden rounded-2xl border border-border/60 bg-card/90 px-3.5 py-2 text-xs font-bold text-foreground shadow-card backdrop-blur sm:block"
          >
            ⚡ Arriving in 18 min
          </span>
          <span
            aria-hidden="true"
            className="animate-nn-float-slow absolute -right-1 bottom-16 z-10 hidden rounded-2xl border border-border/60 bg-card/90 px-3.5 py-2 text-xs font-bold text-foreground shadow-card backdrop-blur sm:block"
          >
            ★ 4.9 · 2,300+ orders
          </span>
          <div className="animate-nn-float-slow">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
