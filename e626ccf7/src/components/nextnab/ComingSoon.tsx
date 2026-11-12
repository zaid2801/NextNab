import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { container, pill } from "@/lib/design-system";

export function ComingSoon({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className={`${container} py-20 lg:py-28`}>
      <div className="mx-auto max-w-xl rounded-[2rem] bg-card px-6 py-14 text-center shadow-card sm:px-12">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <span className={`${pill} mt-6`}>
          <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
          {eyebrow}
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">{description}</p>
        <Link to="/" className="mt-8 inline-block">
          <Button variant="outline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Button>
        </Link>
      </div>
    </section>
  );
}
