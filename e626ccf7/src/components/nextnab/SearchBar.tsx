import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "./Button";

export function SearchBar({
  placeholder = "Search groceries, services...",
  ctaLabel = "Find Now",
  onSearch,
}: {
  placeholder?: string;
  ctaLabel?: string;
  onSearch?: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearch?.(query.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg items-center gap-2 rounded-full border border-border/70 bg-card p-1.5 pl-4 shadow-card"
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <label className="sr-only" htmlFor="nextnab-search">
        Search groceries and services
      </label>
      <input
        id="nextnab-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />
      <Button type="submit" size="sm" className="shrink-0">
        {ctaLabel}
      </Button>
    </form>
  );
}
