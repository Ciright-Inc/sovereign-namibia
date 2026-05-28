"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { MapPinAuditEntry, MapPinCorrectionRequest, MapPinRecord } from "@/lib/map/map-pins-service";

export function MapPinDetail({ id }: { id: string }) {
  const [pin, setPin] = useState<MapPinRecord | null>(null);
  const [audit, setAudit] = useState<MapPinAuditEntry[]>([]);
  const [corrections, setCorrections] = useState<MapPinCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const isPublic = pin?.public_visibility_rules?.public ?? true;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/map-pins/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setPin(data.pin ?? null);
      setAudit(data.audit ?? []);
      setCorrections(data.corrections ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mapHref = useMemo(() => {
    if (!pin) return null;
    return `https://www.openstreetmap.org/?mlat=${pin.latitude}&mlon=${pin.longitude}#map=12/${pin.latitude}/${pin.longitude}`;
  }, [pin]);

  async function patch(p: Record<string, unknown>) {
    setWorking(true);
    try {
      const res = await fetch(`/api/admin/map-pins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success("Updated");
      setPin(data.pin);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setWorking(false);
    }
  }

  async function doDelete() {
    if (!confirm("Delete this pin? This action is permanent.")) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/admin/map-pins/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success("Deleted");
      window.location.href = "/admin/map-pins";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setWorking(false);
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Map Pins</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{pin.pin_name}</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            {pin.pin_type} · {pin.region ?? "Unassigned region"} · {isPublic ? "Public" : "Restricted"}
          </p>
          {mapHref && (
            <a href={mapHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
              View on map ({pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)})
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/map-pins/${pin.id}/edit`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
            Edit
          </Link>
          <button
            type="button"
            disabled={working}
            onClick={() => patch({ verification_status: "verified", verification_authority: "Admin Verification", verification_date: new Date().toISOString() })}
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            Mark Verified
          </button>
          <button
            type="button"
            disabled={working}
            onClick={() => patch({ is_archived: !pin.is_archived })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          >
            {pin.is_archived ? "Unarchive" : "Archive"}
          </button>
          <button
            type="button"
            disabled={working}
            onClick={doDelete}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-lg border border-white/10 bg-[#0f1115] p-6">
          <h2 className="font-medium text-white">Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["Type", pin.pin_type],
              ["Region", pin.region ?? "—"],
              ["Verification", pin.verification_status],
              ["Verification authority", pin.verification_authority ?? "—"],
              ["Verification date", pin.verification_date ? new Date(pin.verification_date).toLocaleString() : "—"],
              ["Trust rating", `${pin.trust_rating}/100`],
              ["Transparency score", `${pin.transparency_score}/100`],
              ["Priority", `${pin.priority}/100`],
              ["Public visibility", isPublic ? "Public" : "Restricted"],
              ["Coordinates precise", (pin.public_visibility_rules?.allowPreciseCoordinates ?? true) ? "Yes" : "No"],
              ["Community feedback", pin.community_feedback_status],
              ["Correction status", pin.correction_request_status],
            ].map(([k, v]) => (
              <div key={k} className="rounded bg-white/[0.03] p-3">
                <dt className="text-[10px] uppercase tracking-wider text-[#6b7280]">{k}</dt>
                <dd className="mt-1 text-sm text-[#d1d5db]">{String(v)}</dd>
              </div>
            ))}
          </dl>
          {pin.description && (
            <div className="mt-4 rounded bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Description</p>
              <p className="mt-2 text-sm text-[#d1d5db]">{pin.description}</p>
            </div>
          )}
          {pin.source_attribution && (
            <div className="mt-4 rounded bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Source attribution</p>
              <p className="mt-2 text-sm text-[#d1d5db]">{pin.source_attribution}</p>
            </div>
          )}
          {!isPublic && pin.public_visibility_rules?.restrictedReason && (
            <div className="mt-4 rounded border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-amber-200/80">Restricted visibility</p>
              <p className="mt-2 text-sm text-amber-100">{pin.public_visibility_rules.restrictedReason}</p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
            <h2 className="font-medium text-white">Correction Requests</h2>
            {corrections.length === 0 ? (
              <p className="mt-3 text-sm text-[#6b7280]">No correction requests submitted.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {corrections.slice(0, 8).map((c) => (
                  <li key={c.id} className="rounded bg-white/[0.03] p-3">
                    <p className="text-xs text-[#d1d5db]">{c.request_type}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[#6b7280]">
                      {c.status} · {new Date(c.created_at).toLocaleString()}
                    </p>
                    {c.evidence_text && <p className="mt-2 text-xs text-[#9ca3af]">{c.evidence_text}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0f1115] p-6">
            <h2 className="font-medium text-white">Audit History</h2>
            {audit.length === 0 ? (
              <p className="mt-3 text-sm text-[#6b7280]">No audit entries yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {audit.slice(0, 10).map((a) => (
                  <li key={a.id} className="rounded bg-white/[0.03] p-3">
                    <p className="font-mono text-xs text-emerald-400/90">{a.action}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[#6b7280]">
                      {new Date(a.created_at).toLocaleString()} {a.geo_country ? `· ${a.geo_country}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

