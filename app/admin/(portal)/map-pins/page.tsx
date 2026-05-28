import { requireAdmin } from "@/lib/require-admin";
import { MapPinsAdmin } from "@/components/admin/map-pins-admin";

export default async function AdminMapPinsPage() {
  await requireAdmin("map_pins.read");
  return <MapPinsAdmin />;
}

