"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type QueueItem = {
  id: string;
  accountType: string;
  verificationStatus: string;
  reviewStatus: string;
  summary: string;
  category: string;
  createdAt: string;
  flagReason: string | null;
};

export default function AdminVerificationsPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verifications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to load queue");
      setQueue(data.queue ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function review(id: string, decision: string) {
    const notes = window.prompt("Review notes (optional):") ?? undefined;
    const res = await fetch("/api/admin/verifications/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Review failed");
      return;
    }
    toast.success(`${decision} recorded`);
    loadQueue();
  }

  const groups = [
    { key: "individual", label: "Pending Individuals" },
    { key: "business", label: "Pending Businesses" },
    { key: "government", label: "Pending Government Entities" },
    { key: "duplicate", label: "Duplicate Records" },
    { key: "suspicious", label: "Suspicious Records" },
    { key: "security", label: "Non-Namibia IP / Failed OTP" },
  ];

  return (
    <div className="min-h-screen bg-[#0c1a2e] text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <Link href="/admin/dashboard" className="text-xs text-white/40 hover:text-white/70">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Verification Queue</h1>
        <p className="mt-1 text-sm text-white/50">
          Pending individuals, businesses, government entities, and security events.
        </p>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        {loading ? (
          <p className="text-white/50">Loading queue…</p>
        ) : (
          groups.map((group) => {
            const items = queue.filter((q) => q.category === group.key);
            return (
              <section key={group.key} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="font-medium">{group.label}</h2>
                <p className="mt-1 text-sm text-white/50">{items.length} items</p>
                <div className="mt-4 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-sm text-white/35">No items.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="rounded-lg bg-white/5 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{item.summary}</p>
                            <p className="text-white/45">
                              {item.verificationStatus} · {item.reviewStatus} ·{" "}
                              {new Date(item.createdAt).toLocaleString("en-NA")}
                            </p>
                          </div>
                          {!item.id.startsWith("sec-") && (
                            <div className="flex flex-wrap gap-2">
                              {["Approved", "Rejected", "More Information Required", "Duplicate Review"].map(
                                (d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => review(item.id, d)}
                                    className="rounded-md border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                                  >
                                    {d}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
