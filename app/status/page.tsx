import type { Metadata } from "next";
import { getPlatformStatus } from "@/lib/status-service";
import { StatusDashboard } from "@/components/status/status-dashboard";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "Live operational status for Sovereign Namibia — service health, regional infrastructure, API latency, and incident reporting.",
  openGraph: {
    title: "System Status | Sovereign Namibia",
    description: "Real-time sovereign infrastructure status centre.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const status = await getPlatformStatus();

  return (
    <div className="sn-status-page min-h-screen bg-[#060e18]">
      <StatusDashboard initialData={status} />
    </div>
  );
}
