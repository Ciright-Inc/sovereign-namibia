"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NAMIBIA_REGIONS } from "@/lib/constants";
import { MAP_PIN_TYPES } from "@/lib/map/map-pins-constants";
import type { MapPinRecord } from "@/lib/map/map-pins-service";

type Props = {
  mode: "create" | "edit";
  initial?: MapPinRecord;
};

export function MapPinForm({ mode, initial }: Props) {
  const router = useRouter();
  const [pinName, setPinName] = useState(initial?.pin_name ?? "");
  const [pinType, setPinType] = useState(initial?.pin_type ?? "Government Office");
  const [lat, setLat] = useState(String(initial?.latitude ?? ""));
  const [lng, setLng] = useState(String(initial?.longitude ?? ""));
  const [region, setRegion] = useState(initial?.region ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState(String(initial?.priority ?? 50));
  const [trustRating, setTrustRating] = useState(String(initial?.trust_rating ?? 50));
  const [transparencyScore, setTransparencyScore] = useState(String(initial?.transparency_score ?? 50));
  const [sourceAttribution, setSourceAttribution] = useState(initial?.source_attribution ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isArchived, setIsArchived] = useState(initial?.is_archived ?? false);

  const [isPublic, setIsPublic] = useState<boolean>((initial?.public_visibility_rules?.public ?? true));
  const [allowPreciseCoordinates, setAllowPreciseCoordinates] = useState<boolean>((initial?.public_visibility_rules?.allowPreciseCoordinates ?? true));
  const [restrictedReason, setRestrictedReason] = useState<string>(initial?.public_visibility_rules?.restrictedReason ?? "");

  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    const la = Number(lat);
    const lo = Number(lng);
    return pinName.trim().length >= 2 && pinType && Number.isFinite(la) && Number.isFinite(lo);
  }, [pinName, pinType, lat, lng]);

  async function save() {
    if (!canSubmit) {
      toast.error("Please fill pin name, type, latitude and longitude.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        pin_name: pinName.trim(),
        pin_type: pinType,
        latitude: Number(lat),
        longitude: Number(lng),
        region: region || undefined,
        description: description || undefined,
        priority: Number(priority),
        trust_rating: Number(trustRating),
        transparency_score: Number(transparencyScore),
        source_attribution: sourceAttribution || undefined,
        is_active: isActive,
        is_archived: isArchived,
        public_visibility_rules: {
          public: isPublic,
          allowPreciseCoordinates,
          restrictedReason: isPublic ? undefined : (restrictedReason || "Restricted by governance policy"),
          showOnLowBandwidthList: isPublic,
        },
      };

      const res = await fetch(mode === "create" ? "/api/admin/map-pins" : `/api/admin/map-pins/${initial?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      toast.success(mode === "create" ? "Pin created" : "Pin updated");
      const id = (data.pin?.id ?? initial?.id) as string | undefined;
      if (id) router.push(`/admin/map-pins/${id}`);
      else router.push("/admin/map-pins");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Governance-grade workflow</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {mode === "create" ? "Create Map Pin" : "Edit Map Pin"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
          Capture coordinates precisely (WGS84), assign region inclusively, and publish with transparent visibility rules.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-[#0f1115] p-6 space-y-4">
          <h2 className="font-medium text-white">Pin Details</h2>
          <label className="block text-xs text-[#6b7280]">
            Pin Name
            <input value={pinName} onChange={(e) => setPinName(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-[#6b7280]">
              Type
              <select value={pinType} onChange={(e) => setPinType(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
                {MAP_PIN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block text-xs text-[#6b7280]">
              Region
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white">
                <option value="">(Unassigned)</option>
                {NAMIBIA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-[#6b7280]">
              Latitude
              <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
            </label>
            <label className="block text-xs text-[#6b7280]">
              Longitude
              <input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
            </label>
          </div>
          <label className="block text-xs text-[#6b7280]">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
          </label>
          <label className="block text-xs text-[#6b7280]">
            Source Attribution
            <input value={sourceAttribution} onChange={(e) => setSourceAttribution(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" placeholder="Institution, dataset, submission channel…" />
          </label>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#0f1115] p-6 space-y-4">
          <h2 className="font-medium text-white">Trust & Visibility</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-[#6b7280]">
              Priority (0–100)
              <input value={priority} onChange={(e) => setPriority(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
            </label>
            <label className="block text-xs text-[#6b7280]">
              Trust Rating (0–100)
              <input value={trustRating} onChange={(e) => setTrustRating(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
            </label>
            <label className="block text-xs text-[#6b7280]">
              Transparency Score (0–100)
              <input value={transparencyScore} onChange={(e) => setTransparencyScore(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-lg border border-white/15 bg-[#050608] px-3 py-2 text-sm text-white" />
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-white/10 bg-[#050608] p-4">
            <label className="flex items-center justify-between gap-3 text-sm text-[#d1d5db]">
              <span>Public visibility</span>
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm text-[#d1d5db]">
              <span>Allow precise coordinates</span>
              <input type="checkbox" checked={allowPreciseCoordinates} onChange={(e) => setAllowPreciseCoordinates(e.target.checked)} />
            </label>
            {!isPublic && (
              <label className="block text-xs text-[#6b7280]">
                Restricted reason
                <input value={restrictedReason} onChange={(e) => setRestrictedReason(e.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0b0c10] px-3 py-2 text-sm text-white" />
              </label>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#050608] px-3 py-2 text-sm text-[#d1d5db]">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#050608] px-3 py-2 text-sm text-[#d1d5db]">
              <input type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} />
              Archived
            </label>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || !canSubmit}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {saving ? "Saving…" : (mode === "create" ? "Create Pin" : "Save Changes")}
          </button>
        </section>
      </div>
    </div>
  );
}

