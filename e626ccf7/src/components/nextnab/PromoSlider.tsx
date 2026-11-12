import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PromoSlide = {
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  to: string;
  search?: Record<string, string>;
  gradient: string;
  icon: LucideIcon;
};

const AUTOPLAY_MS = 4500;

/** Meesho-style auto-advancing promo banner carousel with swipe + dots. */
export function PromoSlider({ slides, label }: { slides: PromoSlide[]; label: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className="group/slider relative overflow-hidden rounded-3xl shadow-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onPointerDown={(event) => {
        dragX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (dragX.current === null) return;
        const delta = event.clientX - dragX.current;
        dragX.current = null;
        if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.title}
            aria-hidden={slideIndex !== index}
            className={cn(
              "relative w-full shrink-0 overflow-hidden bg-gradient-to-br px-6 py-9 sm:px-10 sm:py-12",
              slide.gradient,
            )}
          >
            <span
              aria-hidden="true"
              className="animate-nn-float-slow pointer-events-none absolute -right-10 -top-14 size-56 rounded-full bg-white/10 blur-2xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 right-24 size-44 rounded-full bg-white/10 blur-xl"
            />

            <div className="relative flex items-center gap-6 sm:gap-10">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
                  {slide.badge}
                </span>
                <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {slide.title}
                </h3>
                <p className="mt-2 max-w-md text-sm text-white/85">{slide.subtitle}</p>
                <Link
                  to={slide.to as never}
                  search={slide.search as never}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-soft transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {slide.ctaLabel}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="animate-nn-float hidden shrink-0 sm:block" aria-hidden="true">
                <span className="grid size-28 place-items-center rounded-[2rem] bg-white/15 backdrop-blur lg:size-36">
                  <slide.icon className="size-12 text-white lg:size-16" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-white/40 focus-visible:opacity-100 group-hover/slider:opacity-100"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-white/40 focus-visible:opacity-100 group-hover/slider:opacity-100"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div className="absolute bottom-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {slides.map((slide, dotIndex) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Go to slide ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                onClick={() => go(dotIndex)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  dotIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
