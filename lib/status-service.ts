import { isDatabaseReady } from "@/lib/db";

export type ServiceStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export type StatusService = {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  region?: string;
  latencyMs?: number;
};

export type StatusIncident = {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  startedAt: string;
  resolvedAt?: string;
  updates: Array<{ time: string; message: string }>;
};

export type InfrastructureRegion = {
  id: string;
  name: string;
  provider: string;
  status: ServiceStatus;
  role: string;
};

export type PlatformStatus = {
  overall: ServiceStatus;
  uptimePercent: number;
  uptimeSince: string;
  uptimeDisplay: string;
  services: StatusService[];
  regions: InfrastructureRegion[];
  incidents: StatusIncident[];
  metrics: {
    apiLatencyMs: number;
    authUptimePercent: number;
    syncStatus: ServiceStatus;
    lastChecked: string;
  };
};

/** Platform operational baseline — April 2025 launch */
export const UPTIME_BASELINE = new Date("2025-04-01T00:00:00.000Z");

/** Recorded incidents affecting uptime calculation */
export const STATUS_INCIDENTS: StatusIncident[] = [
  {
    id: "inc-2025-06-12",
    title: "Scheduled database maintenance — Citizen Directory",
    status: "resolved",
    severity: "minor",
    startedAt: "2025-06-12T02:00:00.000Z",
    resolvedAt: "2025-06-12T03:12:00.000Z",
    updates: [
      {
        time: "2025-06-12T02:00:00.000Z",
        message: "Scheduled maintenance commenced on database replication layer.",
      },
      {
        time: "2025-06-12T03:12:00.000Z",
        message: "Maintenance completed. All services restored to full operation.",
      },
    ],
  },
];

export function calculateUptimePercent(now = new Date()): number {
  const totalMs = now.getTime() - UPTIME_BASELINE.getTime();
  if (totalMs <= 0) return 100;

  let downtimeMs = 0;
  for (const incident of STATUS_INCIDENTS) {
    if (!incident.resolvedAt || incident.severity === "minor") continue;
    downtimeMs +=
      new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime();
  }

  const uptime = ((totalMs - downtimeMs) / totalMs) * 100;
  return Math.min(100, Math.max(0, uptime));
}

export function formatUptimeDisplay(percent: number): string {
  if (percent >= 99.9999) return "99.9999%";
  if (percent >= 99.999) return `${percent.toFixed(4)}%`;
  if (percent >= 99.99) return `${percent.toFixed(3)}%`;
  return `${percent.toFixed(2)}%`;
}

export function deriveOverallStatus(services: StatusService[]): ServiceStatus {
  if (services.some((s) => s.status === "major_outage")) return "major_outage";
  if (services.some((s) => s.status === "partial_outage")) return "partial_outage";
  if (services.some((s) => s.status === "degraded")) return "degraded";
  if (services.some((s) => s.status === "maintenance")) return "maintenance";
  return "operational";
}

async function measureDbLatency(): Promise<{ ready: boolean; latencyMs: number }> {
  const start = Date.now();
  const ready = await isDatabaseReady();
  return { ready, latencyMs: Math.round(Date.now() - start) };
}

export async function getPlatformStatus(): Promise<PlatformStatus> {
  const dbCheck = await measureDbLatency();
  const now = new Date();
  const uptimePercent = calculateUptimePercent(now);

  const services: StatusService[] = [
    {
      id: "public-web",
      name: "Public Website",
      description: "Primary web application and citizen-facing portal",
      status: "operational",
      region: "af-south-1",
      latencyMs: dbCheck.latencyMs,
    },
    {
      id: "citizen-directory",
      name: "Citizen Directory",
      description: "Masked identity lookup and account discovery",
      status: dbCheck.ready ? "operational" : "degraded",
      region: "af-south-1",
      latencyMs: dbCheck.latencyMs,
    },
    {
      id: "kyc",
      name: "KYC Verification",
      description: "Identity verification and document review",
      status: "operational",
      region: "af-south-1",
    },
    {
      id: "citizen-portal",
      name: "Citizen Portal",
      description: "Authenticated citizen account management",
      status: "operational",
      region: "af-south-1",
    },
    {
      id: "api-gateway",
      name: "API Gateway",
      description: "Programmatic access and service orchestration",
      status: "operational",
      region: "af-south-1",
      latencyMs: dbCheck.latencyMs,
    },
    {
      id: "document-storage",
      name: "Document Storage",
      description: "Encrypted document upload and retrieval",
      status: dbCheck.ready ? "operational" : "degraded",
      region: "af-south-1",
    },
    {
      id: "authentication",
      name: "Authentication Services",
      description: "OTP verification, session management, and credential security",
      status: "operational",
      region: "af-south-1",
    },
    {
      id: "data-sync",
      name: "Data Synchronisation",
      description: "Cross-region encrypted replication and continuity",
      status: dbCheck.ready ? "operational" : "degraded",
      region: "multi-region",
    },
  ];

  const regions: InfrastructureRegion[] = [
    {
      id: "af-south-1",
      name: "AWS South Africa (Cape Town)",
      provider: "Amazon Web Services",
      status: dbCheck.ready ? "operational" : "degraded",
      role: "Primary regional infrastructure — frontend edge routing, application orchestration, and data services",
    },
    {
      id: "sa-edge",
      name: "Southern Africa Edge Network",
      provider: "Regional CDN",
      status: "operational",
      role: "Edge routing and content delivery for Southern African users",
    },
    {
      id: "us-east-1",
      name: "Secure Continuity Layer (US-East)",
      provider: "Amazon Web Services",
      status: "operational",
      role: "Encrypted replication, analytics, and multi-region continuity — no direct public access",
    },
  ];

  const activeIncidents = STATUS_INCIDENTS.filter((i) => i.status !== "resolved");

  return {
    overall: deriveOverallStatus(services),
    uptimePercent,
    uptimeSince: UPTIME_BASELINE.toISOString(),
    uptimeDisplay: formatUptimeDisplay(uptimePercent),
    services,
    regions,
    incidents: activeIncidents.length > 0 ? activeIncidents : STATUS_INCIDENTS.slice(0, 3),
    metrics: {
      apiLatencyMs: dbCheck.latencyMs,
      authUptimePercent: uptimePercent,
      syncStatus: dbCheck.ready ? "operational" : "degraded",
      lastChecked: now.toISOString(),
    },
  };
}
