import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LocationRow } from "@/types";

const STORAGE_KEY = "nextnab:location-id";

type LocationValue = {
  locations: LocationRow[];
  isLoading: boolean;
  selected: LocationRow | null;
  select: (id: string | null) => void;
  label: string;
  reference: { latitude: number; longitude: number } | null;
};

const LocationContext = createContext<LocationValue | null>(null);

function readStoredId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [storedId, setStoredId] = useState<string | null>(() => readStoredId());

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async (): Promise<LocationRow[]> => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("area");
      if (error) throw error;
      return data ?? [];
    },
  });

  const value = useMemo<LocationValue>(() => {
    const selected = locations.find((location) => location.id === storedId) ?? null;
    const withCoords = locations.filter(
      (location) => location.latitude != null && location.longitude != null,
    );
    const reference = selected
      ? selected.latitude != null && selected.longitude != null
        ? { latitude: selected.latitude, longitude: selected.longitude }
        : null
      : withCoords.length > 0
        ? {
            latitude:
              withCoords.reduce((sum, location) => sum + (location.latitude ?? 0), 0) /
              withCoords.length,
            longitude:
              withCoords.reduce((sum, location) => sum + (location.longitude ?? 0), 0) /
              withCoords.length,
          }
        : null;

    return {
      locations,
      isLoading,
      selected,
      reference,
      select: (id) => {
        setStoredId(id);
        if (id) window.localStorage.setItem(STORAGE_KEY, id);
        else window.localStorage.removeItem(STORAGE_KEY);
      },
      label: selected?.area
        ? `${selected.area}, ${selected.city}`
        : `${locations[0]?.city ?? "Latur"}, ${locations[0]?.state_code ?? "MH"}`,
    };
  }, [locations, isLoading, storedId]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside <LocationProvider>");
  return ctx;
}
