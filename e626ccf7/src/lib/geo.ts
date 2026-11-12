export type LatLng = { lat: number; lng: number };

/** Great-circle distance in metres. */
export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Driving route between two points from the public OSRM demo server. */
export async function fetchDrivingRoute(
  from: LatLng,
  to: LatLng,
): Promise<{ coords: LatLng[]; distanceM: number }> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const json = (await response.json()) as {
    code: string;
    routes?: { geometry: { coordinates: number[][] }; distance: number }[];
  };
  const route = json.routes?.[0];
  if (json.code !== "Ok" || !route) throw new Error("OSRM route not found");
  return {
    coords: route.geometry.coordinates.flatMap(([lng, lat]) =>
      typeof lng === "number" && typeof lat === "number" ? [{ lat, lng }] : [],
    ),
    distanceM: route.distance,
  };
}

/** Minutes to cover `metres` at a typical in-city delivery speed (~20 km/h). */
export function etaMinutes(metres: number): number {
  return Math.max(1, Math.round((metres / 1000 / 20) * 60));
}

/** Drop-off pin snapshot stored on an order, if the customer set one. */
export function orderPin(row: {
  delivery_latitude: number | null;
  delivery_longitude: number | null;
}): LatLng | null {
  if (row.delivery_latitude == null || row.delivery_longitude == null) return null;
  return { lat: row.delivery_latitude, lng: row.delivery_longitude };
}
