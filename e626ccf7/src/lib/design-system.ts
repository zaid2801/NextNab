/**
 * NextNab design system constants.
 * Colors, radii and shadows live as CSS tokens in src/styles.css — these are the
 * reusable Tailwind class recipes built on top of those tokens.
 */

export const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12";

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

export const buttonVariants = {
  primary:
    "bg-primary text-primary-foreground shadow-brand hover:bg-brand active:scale-[0.98]",
  secondary: "bg-secondary text-foreground hover:bg-surface-container",
  ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
  outline: "border border-border bg-card text-foreground hover:border-brand hover:text-primary",
} as const;

export const buttonSizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
} as const;

export const card =
  "rounded-3xl border border-border/70 bg-card shadow-card transition-shadow duration-300";

export const sectionTitle = "text-3xl font-extrabold tracking-tight sm:text-4xl";
export const sectionSubtitle = "text-base text-muted-foreground";

export const pill =
  "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold shadow-soft";
