import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDrivingRoute, type LatLng } from "@/lib/geo";

export type RiderPoint = {
  lat: number;
  lng: number;
  heading: number | null;
  at: number;
};

const channelName = (orderId: string) => `nextnab:order-tracking:${orderId}`;

/**
 * Rider side: streams the device GPS to everyone watching this order over a
 * Supabase Realtime broadcast channel. Ephemeral by design — nothing is
 * persisted, so no extra table or migration is required.
 */
export function usePublishRiderLocation(orderId: string | undefined, active: boolean) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !active) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("This device does not support location sharing.");
      return;
    }

    const channel = supabase.channel(channelName(orderId));
    channel.subscribe();
    setSharing(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords;
        void channel.send({
          type: "broadcast",
          event: "rider-location",
          payload: { lat: latitude, lng: longitude, heading, at: Date.now() } satisfies RiderPoint,
        });
      },
      () => setError("Could not read GPS. Check location permissions for this site."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      void supabase.removeChannel(channel);
      setSharing(false);
    };
  }, [orderId, active]);

  return { sharing, error };
}

/** Customer side: receives the rider's live GPS points for an order. */
export function useRiderLocation(orderId: string | undefined, active: boolean) {
  const [point, setPoint] = useState<RiderPoint | null>(null);

  useEffect(() => {
    if (!orderId || !active) return;
    const channel = supabase.channel(channelName(orderId));
    channel.on("broadcast", { event: "rider-location" }, (message) => {
      setPoint(message["payload"] as RiderPoint);
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId, active]);

  return point;
}

/**
 * Demo helper for the rider dashboard: broadcasts RiderPoint events along the
 * real store→drop driving route so live tracking can be shown end-to-end
 * without physically moving. Uses the same Realtime channel as real GPS.
 */
export function usePublishSimulatedRoute(
  orderId: string | undefined,
  origin: LatLng | null,
  destination: LatLng | null,
  active: boolean,
) {
  const [running, setRunning] = useState(false);
  const [point, setPoint] = useState<RiderPoint | null>(null);
  const oLat = origin?.lat ?? null;
  const oLng = origin?.lng ?? null;
  const dLat = destination?.lat ?? null;
  const dLng = destination?.lng ?? null;

  useEffect(() => {
    if (!orderId || !active || oLat == null || oLng == null || dLat == null || dLng == null) {
      setRunning(false);
      setPoint(null);
      return;
    }
    const from: LatLng = { lat: oLat, lng: oLng };
    const to: LatLng = { lat: dLat, lng: dLng };

    let cancelled = false;
    let timer: number | undefined;
    const channel = supabase.channel(channelName(orderId));
    channel.subscribe();
    setRunning(true);

    void (async () => {
      let coords: LatLng[];
      try {
        coords = (await fetchDrivingRoute(from, to)).coords;
      } catch {
        coords = [from, to];
      }
      if (cancelled || coords.length < 2) return;
      const steps = 120;
      const last = coords.length - 1;
      let i = 0;

      const emit = () => {
        if (cancelled) return;
        const pos = (i / steps) * last;
        const idx = Math.min(last - 1, Math.floor(pos));
        const frac = pos - idx;
        const a = coords[idx] as LatLng;
        const b = (coords[idx + 1] ?? a) as LatLng;
        const lat = a.lat + (b.lat - a.lat) * frac;
        const lng = a.lng + (b.lng - a.lng) * frac;
        const ahead = (coords[Math.min(last, idx + 1)] ?? b) as LatLng;
        const heading =
          ((Math.atan2(ahead.lng - lng, ahead.lat - lat) * 180) / Math.PI + 360) % 360;
        const payload: RiderPoint = { lat, lng, heading, at: Date.now() };
        void channel.send({
          type: "broadcast",
          event: "rider-location",
          payload,
        });
        setPoint(payload);
        i += 1;
        if (i <= steps) {
          timer = window.setTimeout(emit, 600);
        } else {
          setRunning(false);
          setPoint(null);
          void supabase.removeChannel(channel);
        }
      };
      emit();
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      void supabase.removeChannel(channel);
      setRunning(false);
      setPoint(null);
    };
  }, [orderId, active, oLat, oLng, dLat, dLng]);

  return { running, point };
}
