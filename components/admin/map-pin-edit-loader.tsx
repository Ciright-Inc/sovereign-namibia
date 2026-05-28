"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPinForm } from "@/components/admin/map-pin-form";
import type { MapPinRecord } from "@/lib/map/map-pins-service";

export function MapPinEditLoader({ id }: { id: string }) {
  const [pin, setPin] = useState<MapPinRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/map-pins/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load pin");
        setPin(data.pin ?? null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load pin");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6 text-[#9ca3af]">
        Loading…
      </div>
    );
  }
  if (!pin) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0f1115] p-6 text-[#9ca3af]">
        Not found.
      </div>
    );
  }
  return <MapPinForm mode="edit" initial={pin} />;
}

