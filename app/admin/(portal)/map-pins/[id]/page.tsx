import { requireAdmin } from "@/lib/require-admin";
import { MapPinDetail } from "@/components/admin/map-pin-detail";

type RouteProps = { params: Promise<{ id: string }> };

export default async function AdminMapPinDetailPage({ params }: RouteProps) {
  await requireAdmin("map_pins.read");
  const { id } = await params;
  return <MapPinDetail id={id} />;
}

