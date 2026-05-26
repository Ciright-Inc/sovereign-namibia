"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Clock,
  Globe,
  RefreshCw,
  Server,
  Shield,
  Zap,
} from "lucide-react";
import type { PlatformStatus, ServiceStatus } from "@/lib/status-service";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  maintenance: "Maintenance",
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  operational: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  degraded: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  partial_outage: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  major_outage: "text-red-400 bg-red-400/10 border-red-400/20",
  maintenance: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        STATUS_COLORS[status]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "operational" && "bg-emerald-400",
          status === "degraded" && "bg-amber-400",
          status === "partial_outage" && "bg-orange-400",
          status === "major_outage" && "bg-red-400",
          status === "maintenance" && "bg-blue-400"
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

type StatusDashboardProps = {
  initialData: PlatformStatus;
};

export function StatusDashboard({ initialData }: StatusDashboardProps) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as PlatformStatus;
        setData(json);
        setLastRefresh(new Date());
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const overallLabel = STATUS_LABELS[data.overall];

  return (
    <div className="sn-status-dashboard">
      <div className="sn-status-hero relative overflow-hidden px-6 pb-12 pt-10 md:pb-16 md:pt-14">
        <div className="sn-status-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-5xl">
          <p className="sn-footer-eyebrow">status.sovereignnamibia.com</p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[rgba(248,246,242,0.95)] md:text-4xl">
                Sovereign Infrastructure Status
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[rgba(248,246,242,0.5)]">
                Live operational status for Namibia&apos;s sovereign digital governance platform.
                Real service health, regional infrastructure, and incident reporting.
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(196,163,90,0.2)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[rgba(248,246,242,0.7)] transition hover:border-[rgba(196,163,90,0.35)] hover:text-[var(--sn-gold)] disabled:opacity-50"
              aria-label="Refresh status"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sn-status-metric-card">
              <div className="flex items-center gap-2 text-xs text-[rgba(248,246,242,0.45)]">
                <Activity className="h-3.5 w-3.5" aria-hidden />
                Overall Status
              </div>
              <p className="mt-2 text-2xl font-semibold text-[rgba(248,246,242,0.95)]">
                {overallLabel}
              </p>
              <StatusBadge status={data.overall} />
            </div>
            <div className="sn-status-metric-card">
              <div className="flex items-center gap-2 text-xs text-[rgba(248,246,242,0.45)]">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                Uptime Since April 2025
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--sn-gold)]">
                {data.uptimeDisplay}
              </p>
              <p className="mt-1 text-xs text-[rgba(248,246,242,0.35)]">Calculated from incident log</p>
            </div>
            <div className="sn-status-metric-card">
              <div className="flex items-center gap-2 text-xs text-[rgba(248,246,242,0.45)]">
                <Zap className="h-3.5 w-3.5" aria-hidden />
                API Latency
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[rgba(248,246,242,0.95)]">
                {data.metrics.apiLatencyMs}
                <span className="ml-1 text-sm font-normal text-[rgba(248,246,242,0.45)]">ms</span>
              </p>
              <p className="mt-1 text-xs text-[rgba(248,246,242,0.35)]">Database health check</p>
            </div>
            <div className="sn-status-metric-card">
              <div className="flex items-center gap-2 text-xs text-[rgba(248,246,242,0.45)]">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Last Checked
              </div>
              <p className="mt-2 text-lg font-semibold tabular-nums text-[rgba(248,246,242,0.95)]">
                {lastRefresh.toLocaleTimeString("en-NA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
              <p className="mt-1 text-xs text-[rgba(248,246,242,0.35)]">Auto-refresh every 30s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-6 pb-24">
        <section aria-labelledby="services-heading">
          <h2 id="services-heading" className="sn-footer-eyebrow mb-4">
            Service Health
          </h2>
          <div className="space-y-2">
            {data.services.map((service) => (
              <div
                key={service.id}
                className="sn-status-service-row flex flex-col gap-3 rounded-xl border border-[rgba(196,163,90,0.08)] bg-[rgba(255,255,255,0.02)] px-5 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[rgba(248,246,242,0.9)]">{service.name}</p>
                  <p className="mt-0.5 text-xs text-[rgba(248,246,242,0.4)]">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {service.latencyMs !== undefined && (
                    <span className="text-xs tabular-nums text-[rgba(248,246,242,0.35)]">
                      {service.latencyMs}ms
                    </span>
                  )}
                  {service.region && (
                    <span className="text-xs text-[rgba(248,246,242,0.25)]">{service.region}</span>
                  )}
                  <StatusBadge status={service.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="regions-heading">
          <h2 id="regions-heading" className="sn-footer-eyebrow mb-4">
            Regional Infrastructure
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {data.regions.map((region) => (
              <div
                key={region.id}
                className="sn-status-metric-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[var(--sn-gold)]" aria-hidden />
                    <p className="text-sm font-medium text-[rgba(248,246,242,0.9)]">
                      {region.name}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[rgba(248,246,242,0.35)]">{region.provider}</p>
                  <p className="mt-3 text-xs leading-relaxed text-[rgba(248,246,242,0.45)]">
                    {region.role}
                  </p>
                </div>
                <div className="mt-4">
                  <StatusBadge status={region.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sn-footer-eyebrow mb-4">
            Platform Metrics
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sn-status-metric-card">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[var(--sn-gold)]" aria-hidden />
                <p className="text-sm text-[rgba(248,246,242,0.7)]">Authentication Uptime</p>
              </div>
              <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--sn-gold)]">
                {data.metrics.authUptimePercent >= 99.9999
                  ? "99.9999%"
                  : `${data.metrics.authUptimePercent.toFixed(4)}%`}
              </p>
            </div>
            <div className="sn-status-metric-card">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-[var(--sn-gold)]" aria-hidden />
                <p className="text-sm text-[rgba(248,246,242,0.7)]">Data Synchronisation</p>
              </div>
              <div className="mt-2">
                <StatusBadge status={data.metrics.syncStatus} />
              </div>
            </div>
            <div className="sn-status-metric-card">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--sn-gold)]" aria-hidden />
                <p className="text-sm text-[rgba(248,246,242,0.7)]">Historical Uptime</p>
              </div>
              <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--sn-gold)]">
                {data.uptimeDisplay}
              </p>
              <p className="mt-1 text-xs text-[rgba(248,246,242,0.35)]">Since April 2025</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="incidents-heading">
          <h2 id="incidents-heading" className="sn-footer-eyebrow mb-4">
            Incident History
          </h2>
          {data.incidents.length === 0 ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-6 py-8 text-center">
              <p className="text-sm text-emerald-300">No active incidents. All systems normal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="rounded-xl border border-[rgba(196,163,90,0.08)] bg-[rgba(255,255,255,0.02)] p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-[rgba(248,246,242,0.9)]">{incident.title}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs capitalize",
                        incident.status === "resolved"
                          ? "bg-[rgba(248,246,242,0.08)] text-[rgba(248,246,242,0.5)]"
                          : "bg-amber-400/10 text-amber-400"
                      )}
                    >
                      {incident.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgba(248,246,242,0.35)]">
                    {new Date(incident.startedAt).toLocaleString("en-NA")}
                    {incident.resolvedAt &&
                      ` — Resolved ${new Date(incident.resolvedAt).toLocaleString("en-NA")}`}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-[rgba(196,163,90,0.06)] pt-4">
                    {incident.updates.map((update) => (
                      <li
                        key={update.time}
                        className="text-sm text-[rgba(248,246,242,0.55)]"
                      >
                        <span className="text-xs text-[rgba(248,246,242,0.35)]">
                          {new Date(update.time).toLocaleTimeString("en-NA")}
                        </span>
                        <span className="ml-3">{update.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
