"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminResetPasswordPage() {
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirmPassword = String(fd.get("confirmPassword"));

    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      toast.success("Password updated. Redirecting to dashboard…");
      window.location.href = "/admin/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050608] px-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0c0f] p-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Security Required</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Reset Admin Password</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          You must set a new password before accessing the national registry portal.
        </p>

        <form onSubmit={handleReset} className="mt-8 space-y-4">
          <Input
            label="New Password"
            name="password"
            type="password"
            required
            minLength={12}
            className="border-white/15 bg-white/5 text-white"
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            className="border-white/15 bg-white/5 text-white"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
