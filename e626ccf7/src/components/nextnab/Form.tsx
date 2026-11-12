import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const fieldBase =
  "h-12 w-full rounded-2xl border border-border bg-surface-low px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand focus:bg-card";

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean | undefined;
  hint?: string | undefined;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-destructive">{error}</span>}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon };

export function TextInput({ icon: Icon, className, ...props }: InputProps) {
  return (
    <span className="relative block">
      {Icon && (
        <Icon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
      )}
      <input className={cn(fieldBase, Icon && "pl-11", className)} {...props} />
    </span>
  );
}

export function PhoneInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={cn("flex h-12 items-center rounded-2xl border border-border bg-surface-low pl-4 focus-within:border-brand", className)}>
      <span className="text-sm font-bold text-primary">+91</span>
      <span className="mx-3 h-6 w-px bg-border" />
      <input
        inputMode="numeric"
        maxLength={10}
        placeholder="9876543210"
        className="h-full flex-1 rounded-r-2xl bg-transparent pr-4 text-sm outline-none placeholder:text-muted-foreground/70"
        {...props}
      />
    </span>
  );
}

export function SelectInput({
  options,
  placeholder,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[]; placeholder?: string }) {
  return (
    <select className={cn(fieldBase, "appearance-none pr-10", className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function CheckboxRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 rounded-md border-border accent-[var(--primary)]"
      />
      <span>{children}</span>
    </label>
  );
}

export function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <h2 className="font-display text-base font-extrabold">{title}</h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}

export function ChoiceGrid<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | "";
  onChange: (next: T) => void;
  options: readonly { value: T; label: string; icon: LucideIcon }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-secondary p-1.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "grid gap-1.5 rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-brand"
                : "text-muted-foreground hover:bg-accent hover:text-primary",
            )}
          >
            <option.icon className="mx-auto size-5" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
