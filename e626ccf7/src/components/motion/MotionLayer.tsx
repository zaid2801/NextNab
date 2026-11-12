import { useEffect } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

const REVEAL_SELECTOR = "section, article, h1, h2, [data-reveal]";

/** Ambient animated backdrop: drifting aurora orbs over a faint grid. */
export function AuroraBackground() {
  return (
    <div aria-hidden="true" className="nn-aurora">
      <span className="nn-orb nn-orb-1" />
      <span className="nn-orb nn-orb-2" />
      <span className="nn-orb nn-orb-3" />
      <span className="nn-grid" />
    </div>
  );
}

/** Re-mounts the page on navigation so every route plays its entrance. */
export function PageEnter() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div key={pathname} className="nn-page-enter">
      <Outlet />
    </div>
  );
}

/**
 * Site-wide scroll-reveal engine. Runs on every route, so no page needs
 * individual wiring.
 */
export function MotionLayer() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    document.documentElement.classList.add("nn-js");
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("nn-in");
          observer.unobserve(entry.target);
        }
      },
      // Unbounded top margin: anything already scrolled past counts as
      // intersecting, so anchor jumps / scroll restore never strand content.
      { threshold: 0.05, rootMargin: "100000px 0px -6% 0px" },
    );

    const watch = (element: Element) => {
      if (element.classList.contains("nn-in")) return;
      // Anything already on screen is revealed synchronously so hydration
      // never blanks visible content for a frame.
      if (element.getBoundingClientRect().top < window.innerHeight * 0.95) {
        element.classList.add("nn-in");
        return;
      }
      observer.observe(element);
    };

    const scan = (scope: ParentNode) => {
      scope.querySelectorAll?.(REVEAL_SELECTOR).forEach(watch);
    };
    scan(document);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches(REVEAL_SELECTOR)) watch(node);
          scan(node);
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
