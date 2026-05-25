"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminKycPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function review(kycId: string, decision: string) {
    setLoading(kycId);
    try {
      const res = await fetch("/api/admin/kyc/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycId, decision }),
      });
      if (!res.ok) throw new Error("Review failed");
      toast.success(`Application ${decision.toLowerCase()}.`);
    } catch {
      toast.error("Review failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c1a2e] px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">KYC Review Dashboard</h1>
      <p className="mt-2 text-sm text-white/50">Review citizen identity applications.</p>
      <p className="mt-8 text-sm text-white/40">
        Pending applications appear on the dashboard when connected to PostgreSQL.
      </p>
      <div className="mt-8 flex gap-4">
        <Button
          size="sm"
          onClick={() => review("demo", "Approved")}
          disabled={!!loading}
        >
          Demo Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => review("demo", "Rejected")}
          disabled={!!loading}
        >
          Demo Reject
        </Button>
      </div>
    </div>
  );
}
