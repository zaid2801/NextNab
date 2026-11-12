import { Link } from "@tanstack/react-router";
import { container } from "@/lib/design-system";

export function DeliveryHero() {
  return (
    <section className={`${container} pt-6`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-brand to-[#9a63f2] p-6 text-primary-foreground shadow-brand sm:p-8">
        <div className="relative z-10 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Your Neighborhood,
              <br />
              Delivered.
            </h2>
            <p className="mt-3 text-sm font-medium text-primary-foreground/85 sm:text-base">
              30 Min Guaranteed.
            </p>
            <Link
              to="/groceries"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-card px-6 py-3 text-sm font-extrabold tracking-wide text-primary transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              ORDER NOW
            </Link>
          </div>
          <img
            src="/delivery-hero.png"
            alt="NextNab delivery rider on a scooter"
            className="mx-auto w-full max-w-60 rounded-2xl bg-white/95 object-contain p-2 sm:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
