import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/nextnab/Button";
import { LiveOrderMap } from "@/components/nextnab/LiveOrderMap";
import { useRiderLocation } from "@/hooks/useRiderTracking";

type Props = {
  orderId: string;
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
};

/** Collapsible live rider map for dashboards; only opens a channel when expanded. */
export function LiveDeliveryMap({ orderId, origin = null, destination = null }: Props) {
  const [open, setOpen] = useState(false);
  const rider = useRiderLocation(orderId, open);

  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setOpen((value) => !value)}>
        <MapPin className="size-4" aria-hidden="true" />
        {open ? "Hide live map" : "Live rider map"}
      </Button>
      {open && (
        <div className="mt-3">
          <LiveOrderMap rider={rider} origin={origin} destination={destination} />
          {!rider && (
            <p className="mt-2 text-xs text-muted-foreground">
              Waiting for the rider&apos;s GPS signal…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
