import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";

const FULL_PAGE_PREFIXES = ["/merchant", "/admin", "/rider", "/provider", "/partner"];

export function PageShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hideTabBar = FULL_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={`flex-1 ${hideTabBar ? "" : "pb-16 lg:pb-0"}`}>{children}</main>
      <Footer />
      {!hideTabBar && <MobileTabBar />}
    </div>
  );
}
