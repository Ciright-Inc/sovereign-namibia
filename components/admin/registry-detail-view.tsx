"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RegistryForm } from "@/components/admin/registry-form";
import type { RegistryRecord } from "@/lib/registry-service";

type DetailData = {
  record: RegistryRecord;
  notes: Array<{ id: string; note: string; created_at: string }>;
  attachments: Array<{ id: string; filename: string; created_at: string }>;
  auditHistory: Array<{ id: string; action: string; created_at: string; geo_country: string | null }>;
};

export function RegistryDetailView({ id }: { id: string }) {
  const [data, setData] = useState<DetailData | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/registry/${id}`);
    if (!res.ok) return;
    setData(await res.json());
  }

  useEffect(() => { load(); }, [id]);

  async function addNote() {
    if (!note.trim()) return;
    const res = await fetch(`/api/admin/registry/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) { setNote(""); load(); toast.success("Note added"); }
  }

  async function handleDelete() {
    if (!confirm("Delete this registry record?")) return;
    const res = await fetch(`/api/admin/registry/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); window.location.href = `/admin/${data?.record.entity_type === "citizen" ? "citizens" : data?.record.entity_type}`; }
  }

  if (!data) return <p className="text-[#6b7280]">Loading record…</p>;

  const { record, notes, attachments, auditHistory } = data;

  if (editing) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-white">Edit {record.name}</h1>
        <RegistryForm entityType={record.entity_type as never} initial={record} onSuccess={() => { setEditing(false); load(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-emerald-400">{record.registry_id}</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{record.name}</h1>
          {record.acronym && <p className="text-sm text-[#9ca3af]">{record.acronym}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white">Edit</button>
          <button type="button" onClick={handleDelete} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400">Delete</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-white/10 bg-[#0f1115] p-5">
            <h2 className="font-medium text-white">Record Details</h2>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              {[
                ["Category", record.category], ["Province", record.province], ["Status", record.status],
                ["Verification", record.verification_status], ["Classification", record.national_classification],
                ["Address", record.address], ["Website", record.website], ["Email", record.primary_email],
                ["Phone", record.primary_phone],
                ...(record.gps_lat ? [["GPS", `${record.gps_lat}, ${record.gps_lng}`] as [string, string]] : []),
              ].map(([k, v]) => v ? (
                <div key={k}><dt className="text-[#6b7280]">{k}</dt><dd className="text-[#d1d5db]">{v}</dd></div>
              ) : null)}
            </dl>
            {record.description && <p className="mt-4 text-sm text-[#9ca3af]">{record.description}</p>}
          </div>

          {Object.keys(record.metadata).length > 0 && (
            <div className="rounded-lg border border-white/10 bg-[#0f1115] p-5">
              <h2 className="font-medium text-white">Extended Metadata</h2>
              <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                {Object.entries(record.metadata).map(([k, v]) => (
                  <div key={k}><dt className="text-[#6b7280]">{k.replace(/_/g, " ")}</dt><dd className="text-[#d1d5db]">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></div>
                ))}
              </dl>
            </div>
          )}

          {record.gps_lat && record.gps_lng && (
            <div className="rounded-lg border border-white/10 bg-[#0f1115] p-5">
              <h2 className="font-medium text-white">Map Location</h2>
              <a href={`https://www.openstreetmap.org/?mlat=${record.gps_lat}&mlon=${record.gps_lng}#map=14/${record.gps_lat}/${record.gps_lng}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
                View on map ({record.gps_lat}, {record.gps_lng})
              </a>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-[#0f1115] p-5">
            <h2 className="font-medium text-white">Notes</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {notes.map((n) => <li key={n.id} className="rounded bg-white/[0.03] p-2 text-[#9ca3af]">{n.note}</li>)}
            </ul>
            <div className="mt-3 flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note…" className="flex-1 rounded border border-white/15 bg-transparent px-3 py-2 text-sm text-white" />
              <button type="button" onClick={addNote} className="rounded bg-white/10 px-3 py-2 text-sm text-white">Add</button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0f1115] p-5">
            <h2 className="font-medium text-white">Attachments</h2>
            <ul className="mt-3 space-y-1 text-sm text-[#9ca3af]">
              {attachments.length === 0 ? <li>No attachments</li> : attachments.map((a) => <li key={a.id}>{a.filename}</li>)}
            </ul>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0f1115] p-5">
            <h2 className="font-medium text-white">Audit History</h2>
            <ul className="mt-3 space-y-1 text-xs">
              {auditHistory.map((a) => (
                <li key={a.id} className="text-[#6b7280]">
                  <span className="font-mono text-emerald-400/80">{a.action}</span> · {new Date(a.created_at).toLocaleString()}
                  {a.geo_country && ` · ${a.geo_country}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
