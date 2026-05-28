import { requireAdmin } from "@/lib/require-admin";
import { MapPinForm } from "@/components/admin/map-pin-form";

export default async function NewMapPinPage() {
  await requireAdmin("map_pins.write");
  return <MapPinForm mode="create" />;
}

