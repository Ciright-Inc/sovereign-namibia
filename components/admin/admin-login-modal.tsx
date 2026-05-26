"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminLoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");

      if (data.mustResetPassword) {
        window.location.href = "/admin/reset-password";
        return;
      }
      window.location.href = "/admin/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close admin login"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#0a0c0f] p-8 shadow-2xl"
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Authorized Access</p>
        <h2 id="admin-login-title" className="mt-2 text-xl font-semibold text-white">
          Admin Login
        </h2>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Secure sovereign registry administration. All access is audited.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <Input
            label="Username / Email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
          />
          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Authenticating…" : "Login"}
            </Button>
            <button
              type="button"
              className="text-sm text-[#9ca3af] transition hover:text-white"
              onClick={async () => {
                const email = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value;
                if (!email) { toast.error("Enter your email first"); return; }
                const res = await fetch("/api/admin/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
                const data = await res.json();
                toast.success(data.message ?? "Reset request submitted");
              }}
            >
              Forgot Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
