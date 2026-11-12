import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

export function HomeSearch({ mode }: { mode: "grocery" | "services" }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void navigate({ to: "/search", search: { q: term.trim(), mode } });
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative">
      <label htmlFor="home-search" className="sr-only">
        Search shops or items
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary"
        aria-hidden="true"
      />
      <input
        id="home-search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={mode === "grocery" ? "Search shops or items" : "Search services or pros"}
        className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 text-sm shadow-soft outline-none transition-colors focus:border-brand"
      />
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
