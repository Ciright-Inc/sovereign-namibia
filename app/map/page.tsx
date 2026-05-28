import { headers } from "next/headers";
import { MapExperience } from "@/components/map/map-experience";

export default async function MapPage() {
  // Pass through request headers so the client can choose low-bandwidth defaults if needed later.
  const _headers = await headers();
  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)]">
      <MapExperience />
    </div>
  );
}

