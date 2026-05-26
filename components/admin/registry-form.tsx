"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ENTITY_CATEGORIES, ENTITY_METADATA_FIELDS, NAMIBIA_PROVINCES } from "@/lib/registry-entity-schemas";
import type { RegistryEntityType } from "@/lib/admin-rbac";
import type { RegistryRecord } from "@/lib/registry-service";

type RegistryFormProps = {
  entityType: RegistryEntityType;
  initial?: Partial<RegistryRecord>;
  onSuccess?: () => void;
};

export function RegistryForm({ entityType, initial, onSuccess }: RegistryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial?.id);
  const metaFields = ENTITY_METADATA_FIELDS[entityType];
  const categories = ENTITY_CATEGORIES[entityType];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const metadata: Record<string, unknown> = { ...(initial?.metadata ?? {}) };
    for (const field of metaFields) {
      const val = fd.get(`meta_${field.key}`);
      if (val != null && String(val).trim()) {
        metadata[field.key] = field.type === "number" ? Number(val) : field.type === "boolean" ? val === "true" : String(val);
      }
    }

    const payload = {
      entity_type: entityType,
      name: String(fd.get("name")),
      acronym: String(fd.get("acronym") || "") || null,
      description: String(fd.get("description") || "") || null,
      category: String(fd.get("category") || "") || null,
      status: String(fd.get("status") || "active"),
      verification_status: String(fd.get("verification_status") || "pending"),
      province: String(fd.get("province") || "") || null,
      address: String(fd.get("address") || "") || null,
      website: String(fd.get("website") || "") || null,
      primary_email: String(fd.get("primary_email") || "") || null,
      primary_phone: String(fd.get("primary_phone") || "") || null,
      gps_lat: fd.get("gps_lat") ? Number(fd.get("gps_lat")) : null,
      gps_lng: fd.get("gps_lng") ? Number(fd.get("gps_lng")) : null,
      metadata,
      tags: String(fd.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      const url = isEdit ? `/api/admin/registry/${initial!.id}` : "/api/admin/registry";
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success(isEdit ? "Record updated" : "Record created");
      onSuccess?.();
      if (!isEdit) router.push(`/admin/registry/${data.record.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-white/15 bg-[#0f1115] px-3 py-2 text-sm text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-white/10 bg-[#0f1115] p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Name *</span>
          <input name="name" required defaultValue={initial?.name} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Acronym</span>
          <input name="acronym" defaultValue={initial?.acronym ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-[#9ca3af]">Description</span>
          <textarea name="description" rows={3} defaultValue={initial?.description ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Category</span>
          <select name="category" defaultValue={initial?.category ?? ""} className={`mt-1 ${inputClass}`}>
            <option value="">—</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Province</span>
          <select name="province" defaultValue={initial?.province ?? ""} className={`mt-1 ${inputClass}`}>
            <option value="">—</option>
            {NAMIBIA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Status</span>
          <select name="status" defaultValue={initial?.status ?? "active"} className={`mt-1 ${inputClass}`}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Verification</span>
          <select name="verification_status" defaultValue={initial?.verification_status ?? "pending"} className={`mt-1 ${inputClass}`}>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-[#9ca3af]">Address</span>
          <input name="address" defaultValue={initial?.address ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">GPS Lat</span>
          <input name="gps_lat" type="number" step="any" defaultValue={initial?.gps_lat ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">GPS Lng</span>
          <input name="gps_lng" type="number" step="any" defaultValue={initial?.gps_lng ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Website</span>
          <input name="website" type="url" defaultValue={initial?.website ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Email</span>
          <input name="primary_email" type="email" defaultValue={initial?.primary_email ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Phone</span>
          <input name="primary_phone" defaultValue={initial?.primary_phone ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="block text-sm">
          <span className="text-[#9ca3af]">Tags (comma-separated)</span>
          <input name="tags" defaultValue={initial?.tags?.join(", ") ?? ""} className={`mt-1 ${inputClass}`} />
        </label>
      </div>

      {metaFields.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-[#6b7280]">Entity-specific fields</p>
          <div className="grid gap-4 md:grid-cols-2">
            {metaFields.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="text-[#9ca3af]">{field.label}</span>
                {field.type === "boolean" ? (
                  <select name={`meta_${field.key}`} defaultValue={String(initial?.metadata?.[field.key] ?? "false")} className={`mt-1 ${inputClass}`}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    name={`meta_${field.key}`}
                    type={field.type === "number" ? "number" : "text"}
                    defaultValue={String(initial?.metadata?.[field.key] ?? "")}
                    className={`mt-1 ${inputClass}`}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50">
          {loading ? "Saving…" : isEdit ? "Update Record" : "Create Record"}
        </button>
        <Link href={`/admin/${entityType === "citizen" ? "citizens" : entityType}`} className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-[#9ca3af]">
          Cancel
        </Link>
      </div>
    </form>
  );
}
