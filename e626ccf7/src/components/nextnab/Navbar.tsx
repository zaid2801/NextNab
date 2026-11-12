import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, Menu, Package, ShieldCheck, ShoppingCart, User, Wrench, X } from "lucide-react";
import { Logo } from "./Logo";
import { LocationSelector } from "./LocationSelector";
import { NotificationsBell } from "./NotificationsBell";
import { Button } from "./Button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { container } from "@/lib/design-system";

const navLinks = [
  { to: "/groceries", label: "Groceries" },
  { to: "/home-services", label: "Home Services" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/partner", label: "Partner with Us" },
] as const;

const iconLink =
  "grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-primary";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut, roles } = useAuth();
  const { count } = useCart();
  const isAdmin = roles.includes("admin");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <div className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="hidden h-6 w-px bg-border sm:block" />
          <LocationSelector className="inline-flex" />
        </div>

        <nav aria-label="Main" className="hidden min-w-0 items-center gap-1 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user && (
            <span className="hidden sm:block">
              <NotificationsBell />
            </span>
          )}
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-brand hover:text-primary"
          >
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-1 lg:flex">
              <Link
                to="/orders"
                aria-label="Orders"
                title="Orders"
                className={iconLink}
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                <Package className="size-5" />
              </Link>
              <Link
                to="/bookings"
                aria-label="Bookings"
                title="Bookings"
                className={iconLink}
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                <Wrench className="size-5" />
              </Link>
              <Link
                to="/account"
                aria-label="Account"
                title="Account"
                className={iconLink}
                activeProps={{ className: "bg-secondary text-primary" }}
              >
                <User className="size-5" />
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  aria-label="Admin panel"
                  title="Admin panel"
                  className={iconLink}
                  activeProps={{ className: "bg-secondary text-primary" }}
                >
                  <ShieldCheck className="size-5" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out"
                title="Sign out"
                className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-brand hover:text-primary"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden lg:block">
              <Button size="sm">Login / Sign up</Button>
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background xl:hidden">
          <div className={`${container} flex flex-col gap-1 py-3`}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/orders"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Package className="size-4" /> My orders
                </Link>
                <Link
                  to="/bookings"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Wrench className="size-4" /> My bookings
                </Link>
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <User className="size-4" /> My account
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <ShieldCheck className="size-4" /> Admin panel
                  </Link>
                )}

                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                >
                  <LogOut className="size-4" /> Sign out
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="mt-2">
                <Button className="w-full">
                  <User className="size-4" /> Login / Sign up
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
