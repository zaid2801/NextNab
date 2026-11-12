import type { Store } from "@/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isStoreOpen(store: Store, now: Date = new Date()): boolean {
  if (!store.is_online || !store.is_live) return false;
  const today = DAY_NAMES[now.getDay()];
  if (!today || !store.open_days.includes(today)) return false;
  if (!store.opening_time || !store.closing_time) return true;
  const minutes = (value: string) => {
    const [hours, mins] = value.split(":").map(Number);
    return (hours || 0) * 60 + (mins || 0);
  };
  const current = now.getHours() * 60 + now.getMinutes();
  const open = minutes(store.opening_time);
  const close = minutes(store.closing_time);
  return close > open ? current >= open && current < close : current >= open || current < close;
}

export function distanceKm(
  aLat: number | null,
  aLng: number | null,
  bLat: number | null,
  bLng: number | null,
): number | null {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return null;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * earth * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function formatKm(km: number | null): string | null {
  return km == null ? null : `${km.toFixed(1)} km`;
}
