import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng;
  onChange: (point: LatLng) => void;
  className?: string;
};

const PIN_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44"><path d="M17 1C8.7 1 2 7.7 2 16c0 11 15 27 15 27s15-16 15-27C32 7.7 25.3 1 17 1z" fill="#5300b7" stroke="#ffffff" stroke-width="2"/><circle cx="17" cy="16" r="6" fill="#ffffff"/></svg>`,
);

/** Real OSM map with a draggable drop pin; tap anywhere to move the pin. */
export function PinMap({ value, onChange, className = "h-64" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const draggingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((mod) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = mod.default;
      const map = L.map(containerRef.current, { zoomControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.icon({
        iconUrl: `data:image/svg+xml,${PIN_SVG}`,
        iconSize: [34, 44],
        iconAnchor: [17, 42],
      });
      const marker = L.marker([value.lat, value.lng], { icon, draggable: true }).addTo(map);
      marker.on("dragstart", () => {
        draggingRef.current = true;
      });
      marker.on("dragend", () => {
        draggingRef.current = false;
        const at = marker.getLatLng();
        onChangeRef.current({ lat: at.lat, lng: at.lng });
      });
      map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(event.latlng);
        onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
      map.setView([value.lat, value.lng], 16);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || draggingRef.current) return;
    const at = marker.getLatLng();
    if (Math.abs(at.lat - value.lat) > 1e-9 || Math.abs(at.lng - value.lng) > 1e-9) {
      marker.setLatLng([value.lat, value.lng]);
      mapRef.current?.panTo([value.lat, value.lng]);
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`${className} w-full overflow-hidden rounded-2xl border border-border/60`}
      role="application"
      aria-label="Delivery pin map — drag the pin or tap the map to set your exact drop location"
    />
  );
}
