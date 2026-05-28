"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { LanguageId } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { MapPinRecord } from "@/lib/map/map-pins-service";

export function PinInfoCard({ pin, lang, onClose }: { pin: MapPinRecord; lang: LanguageId; onClose: () => void }) {
  const [openCorrection, setOpenCorrection] = useState(false);
  const [message, setMessage] = useState("");
  const [evidence, setEvidence] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPublic = pin.public_visibility_rules?.public ?? true;
  const coordsAllowed = pin.public_visibility_rules?.allowPreciseCoordinates ?? true;

  const coords = useMemo(() => {
    if (!coordsAllowed) return "Coordinates restricted";
    return `${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`;
  }, [pin, coordsAllowed]);

  async function submitCorrection() {
    if (!message.trim()) {
      toast.error("Please describe the correction.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/map/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin_id: pin.id,
          request_type: "pin_correction",
          proposed_changes: { message: message.trim() },
          evidence_text: evidence.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      toast.success(t(lang, "correctionSubmitted"));
      setOpenCorrection(false);
      setMessage("");
      setEvidence("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sn-card w-full max-w-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="sn-eyebrow">{t(lang, "mapPins")}</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--sn-blue)]">{pin.pin_name}</h3>
          <p className="mt-2 text-sm text-[rgba(12,45,74,0.7)]">
            {pin.pin_type} · {pin.region ?? "Unassigned"} · {isPublic ? "Public" : t(lang, "restricted")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[rgba(12,45,74,0.12)] bg-white px-3 py-2 text-xs text-[rgba(12,45,74,0.75)] hover:bg-[rgba(255,255,255,0.9)]"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[rgba(12,45,74,0.12)] bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[rgba(12,45,74,0.55)]">Verification</p>
          <p className="mt-1 text-sm text-[rgba(12,45,74,0.8)]">{pin.verification_status}</p>
          {pin.verification_authority && (
            <p className="mt-1 text-xs text-[rgba(12,45,74,0.6)]">{pin.verification_authority}</p>
          )}
        </div>
        <div className="rounded-lg border border-[rgba(12,45,74,0.12)] bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[rgba(12,45,74,0.55)]">Coordinates</p>
          <p className="mt-1 font-mono text-xs text-[rgba(12,45,74,0.8)]">{coords}</p>
        </div>
      </div>

      {pin.description && (
        <div className="mt-4 rounded-lg border border-[rgba(12,45,74,0.12)] bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[rgba(12,45,74,0.55)]">Context</p>
          <p className="mt-2 text-sm text-[rgba(12,45,74,0.75)]">{pin.description}</p>
        </div>
      )}

      {pin.source_attribution && (
        <p className="mt-4 text-xs text-[rgba(12,45,74,0.6)]">
          Source attribution: {pin.source_attribution}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpenCorrection((v) => !v)}
          className="sn-btn sn-btn-outline"
        >
          {t(lang, "submitCorrection")}
        </button>
      </div>

      {openCorrection && (
        <div className="mt-4 rounded-lg border border-[rgba(12,45,74,0.12)] bg-white p-4">
          <p className="text-sm font-medium text-[var(--sn-blue)]">Correction request</p>
          <p className="mt-1 text-xs text-[rgba(12,45,74,0.6)]">
            This workflow is consent-based and auditable. Do not include personal identity numbers or private addresses.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-lg border border-[rgba(12,45,74,0.18)] bg-[rgba(248,246,242,0.8)] px-3 py-2 text-sm text-[var(--sn-blue)]"
            placeholder="Describe what should be corrected…"
          />
          <input
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[rgba(12,45,74,0.18)] bg-[rgba(248,246,242,0.8)] px-3 py-2 text-sm text-[var(--sn-blue)]"
            placeholder="Evidence link or note (optional)"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={submitting} onClick={submitCorrection} className="sn-btn sn-btn-primary disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button type="button" onClick={() => setOpenCorrection(false)} className="sn-btn sn-btn-outline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

