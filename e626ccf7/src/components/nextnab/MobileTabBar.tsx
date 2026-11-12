import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, ShoppingCart, LayoutGrid, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/groceries", label: "Product", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: ShoppingCart, badge: true },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account", label: "Profile", icon: User },
] as const;

export function MobileTabBar() {
  const { count } = useCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <tab.icon className="size-5" aria-hidden="true" />
                  {"badge" in tab && tab.badge && count > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {count}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
