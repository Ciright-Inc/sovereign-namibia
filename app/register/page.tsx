"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHero } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullLegalName: form.get("fullLegalName"),
          mobileNumber: form.get("mobileNumber"),
          email: form.get("email"),
          dateOfBirth: form.get("dateOfBirth"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setSubmitted(true);
      toast.success("Registration submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Citizen Registration"
        title="Register your sovereign citizen account."
        subtitle="Only verified citizens may access government services. Your information is protected."
      />

      <section className="mx-auto max-w-xl px-6 pb-24">
        {submitted ? (
          <div className="sn-card p-8 text-center">
            <h2 className="text-lg font-semibold text-[var(--sn-blue)]">Registration received</h2>
            <p className="mt-4 sn-prose text-sm">
              Your registration is under review. You will receive instructions to complete identity
              verification.
            </p>
            <Link href="/find-account" className="mt-6 inline-block">
              <Button variant="outline">Search Directory Instead</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="sn-card space-y-5 p-8">
            <Input label="Full legal name" name="fullLegalName" required />
            <Input label="Mobile number" name="mobileNumber" required placeholder="+264 ..." />
            <Input label="Email" name="email" type="email" />
            <Input label="Date of birth" name="dateOfBirth" type="date" required />
            <p className="text-xs text-[rgba(12,45,74,0.5)]">
              By registering, you agree to our{" "}
              <Link href="/legal/terms" className="underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit Registration"}
            </Button>
          </form>
        )}
      </section>
    </>
  );
}
