import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { etaMinutes, fetchDrivingRoute, haversine, type LatLng } from "@/lib/geo";
import type { RiderPoint } from "@/hooks/useRiderTracking";

type Props = {
  rider: RiderPoint | null;
  origin: LatLng | null;
  destination?: LatLng | null;
  className?: string;
};

type Leaflet = typeof import("leaflet");

const STORE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#006c49" stroke="#ffffff" stroke-width="3"/><path d="M9 13h12v8H9z" fill="#ffffff"/><path d="M8 13l2-4h10l2 4z" fill="#d9f2e4"/></svg>`,
);
const HOME_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44"><path d="M17 1C8.7 1 2 7.7 2 16c0 11 15 27 15 27s15-16 15-27C32 7.7 25.3 1 17 1z" fill="#1f2937" stroke="#ffffff" stroke-width="2"/><path d="M11 16l6-5 6 5v7h-12z" fill="#ffffff"/></svg>`,
);
const RIDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#5300b7" stroke="#ffffff" stroke-width="3"/><path d="M20 8l6 18-6-4-6 4z" fill="#ffffff"/></svg>`;

export function LiveOrderMap({ rider, origin, destination = null, className = "h-72" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<Leaflet | null>(null);
  const riderMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const originMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const destMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const routeLineRef = useRef<import("leaflet").Polyline | null>(null);
  const trailRef = useRef<import("leaflet").Polyline | null>(null);
  const trailPointsRef = useRef<LatLng[]>([]);
  const shownRef = useRef<LatLng | null>(null);
  const animRef = useRef<number | null>(null);
  const fittedRef = useRef(false);
  const routePendingRef = useRef(false);
  const routeKeyRef = useRef("");
  const latestRef = useRef<Props>({ rider, origin, destination });
  latestRef.current = { rider, origin, destination };
  const [eta, setEta] = useState<{ km: number; mins: number } | null>(null);

  useEffect(() => {
    if (!rider || !destination) {
      setEta(null);
      return;
    }
    const metres = haversine(rider, destination);
    setEta({ km: metres / 1000, mins: etaMinutes(metres) });
  }, [rider, destination]);

  useEffect(() => {
    let cancelled = false;

    const animateRiderTo = (target: LatLng, heading: number | null) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      const marker = riderMarkerRef.current;
      if (!L || !map || !marker) return;
      const from = shownRef.current ?? target;
      const start = performance.now();
      const duration = 1100;
      if (animRef.current) cancelAnimationFrame(animRef.current);

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * (2 - t);
        const lat = from.lat + (target.lat - from.lat) * eased;
        const lng = from.lng + (target.lng - from.lng) * eased;
        marker.setLatLng([lat, lng]);
        if (heading != null) {
          const element = marker.getElement()?.firstElementChild as HTMLElement | undefined;
          if (element) element.style.transform = `rotate(${heading}deg)`;
        }
        shownRef.current = { lat, lng };
        if (t < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          map.panTo([target.lat, target.lng], { animate: true, duration: 0.6 });
        }
      };
      animRef.current = requestAnimationFrame(step);
    };

    const apply = () => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      const { rider: point, origin: store, destination: drop } = latestRef.current;

      if (store) {
        const at = [store.lat, store.lng] as [number, number];
        if (!originMarkerRef.current) {
          originMarkerRef.current = L.marker(at, {
            icon: L.icon({
              iconUrl: `data:image/svg+xml,${STORE_SVG}`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
            interactive: false,
          }).addTo(map);
        } else {
          originMarkerRef.current.setLatLng(at);
        }
      }

      if (drop) {
        const at = [drop.lat, drop.lng] as [number, number];
        if (!destMarkerRef.current) {
          destMarkerRef.current = L.marker(at, {
            icon: L.icon({
              iconUrl: `data:image/svg+xml,${HOME_SVG}`,
              iconSize: [34, 44],
              iconAnchor: [17, 42],
            }),
            interactive: false,
          }).addTo(map);
        } else {
          destMarkerRef.current.setLatLng(at);
        }
      }

      if (store && drop) {
        const key = `${store.lat},${store.lng}|${drop.lat},${drop.lng}`;
        if (routeKeyRef.current !== key) {
          routeKeyRef.current = key;
          routePendingRef.current = true;
          void fetchDrivingRoute(store, drop)
            .then((route) => route.coords)
            .catch(() => [store, drop])
            .then((coords) => {
              routePendingRef.current = false;
              if (cancelled || !leafletRef.current || !mapRef.current) return;
              const line = leafletRef.current.polyline(
                coords.map((c) => [c.lat, c.lng] as [number, number]),
                { color: "#7331df", weight: 4, opacity: 0.75, dashArray: "1 7", lineCap: "round" },
              );
              routeLineRef.current?.remove();
              routeLineRef.current = line.addTo(mapRef.current);
              if (!fittedRef.current) {
                mapRef.current.fitBounds(line.getBounds(), { padding: [42, 42] });
                fittedRef.current = true;
              }
            });
        }
      }

      if (point) {
        if (!riderMarkerRef.current) {
          riderMarkerRef.current = L.marker([point.lat, point.lng], {
            icon: L.divIcon({
              html: `<div style="width:40px;height:40px">${RIDER_SVG}</div>`,
              className: "nn-rider-icon",
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            }),
            interactive: false,
            zIndexOffset: 500,
          }).addTo(map);
          shownRef.current = { lat: point.lat, lng: point.lng };
        } else {
          animateRiderTo({ lat: point.lat, lng: point.lng }, point.heading);
        }
        trailPointsRef.current = [
          ...trailPointsRef.current.slice(-199),
          { lat: point.lat, lng: point.lng },
        ];
        if (!trailRef.current) {
          trailRef.current = L.polyline(
            trailPointsRef.current.map((c) => [c.lat, c.lng] as [number, number]),
            { color: "#5300b7", weight: 4, opacity: 0.9 },
          ).addTo(map);
        } else {
          trailRef.current.setLatLngs(
            trailPointsRef.current.map((c) => [c.lat, c.lng] as [number, number]),
          );
        }
        if (!fittedRef.current && !routePendingRef.current) {
          map.setView([point.lat, point.lng], 15);
          fittedRef.current = true;
        }
      } else if (store && !fittedRef.current) {
        map.setView([store.lat, store.lng], 15);
        fittedRef.current = true;
      }
    };

    if (!mapRef.current && containerRef.current) {
      void import("leaflet").then((mod) => {
        if (cancelled || !containerRef.current) return;
        const L = mod.default;
        leafletRef.current = L;
        const map = L.map(containerRef.current, { zoomControl: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        apply();
      });
    } else {
      apply();
    }

    return () => {
      cancelled = true;
    };
  }, [rider, origin, destination]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
      riderMarkerRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      routeLineRef.current = null;
      trailRef.current = null;
      trailPointsRef.current = [];
      fittedRef.current = false;
      routeKeyRef.current = "";
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`${className} w-full overflow-hidden rounded-2xl border border-border/60`}
        role="img"
        aria-label="Live map of your rider's location"
      />
      {eta && (
        <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-bold shadow-soft">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Rider ~{eta.km.toFixed(1)} km away · ~{eta.mins} min
        </span>
      )}
    </div>
  );
}
