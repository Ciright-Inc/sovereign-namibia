import { requireAdmin } from "@/lib/require-admin";
import { MapPinEditLoader } from "@/components/admin/map-pin-edit-loader";

type RouteProps = { params: Promise<{ id: string }> };

export default async function EditMapPinPage({ params }: RouteProps) {
  await requireAdmin("map_pins.write");
  const { id } = await params;
  return <MapPinEditLoader id={id} />;
}

