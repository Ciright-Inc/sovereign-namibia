"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);

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
      window.location.href = "/admin/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c1a2e] px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs uppercase tracking-widest text-white/50">Administration</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">admin.sovereignnamibia.com</h1>
        <p className="mt-2 text-sm text-white/60">Authorized personnel only. MFA required.</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            className="bg-white/10 text-white border-white/20"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            className="bg-white/10 text-white border-white/20"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
