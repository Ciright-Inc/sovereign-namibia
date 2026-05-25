"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHero } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DirectoryMatchResult } from "@/lib/masking";

export default function FindAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<DirectoryMatchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSearched(false);

    const form = new FormData(e.currentTarget);
    const payload = {
      fullLegalName: String(form.get("fullLegalName") ?? ""),
      mobileNumber: String(form.get("mobileNumber") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      nationalId: String(form.get("nationalId") ?? "") || undefined,
      email: String(form.get("email") ?? "") || undefined,
    };

    try {
      const res = await fetch("/api/directory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setMatches(data.matches ?? []);
      setMessage(data.message ?? "");
      setSearched(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Citizen Directory"
        title="Find your citizen identity record."
        subtitle="Your information is protected. Search results display only masked, privacy-safe data."
      />

      <section className="mx-auto max-w-xl px-6 pb-24">
        <form onSubmit={handleSearch} className="sn-card space-y-5 p-8">
          <Input
            label="Full legal name"
            name="fullLegalName"
            required
            placeholder="As on National ID"
            autoComplete="name"
          />
          <Input
            label="Mobile number"
            name="mobileNumber"
            required
            placeholder="+264 ..."
            autoComplete="tel"
          />
          <Input
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            required
          />
          <Input
            label="National ID number (optional)"
            name="nationalId"
            hint="Last 4 digits may be used to refine your match."
            placeholder="Optional"
          />
          <Input
            label="Email (optional)"
            name="email"
            type="email"
            placeholder="Optional"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Searching…" : "Search Directory"}
          </Button>
        </form>

        {searched && (
          <div className="mt-8">
            <p className="sn-prose mb-6 text-center">{message}</p>
            {matches.map((match) => (
              <div key={match.id} className="sn-card mb-4 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(12,45,74,0.08)] text-sm font-semibold text-[var(--sn-blue)]">
                    {match.initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--sn-blue)]">{match.maskedName}</p>
                    {match.maskedMobile && (
                      <p className="mt-1 text-sm text-[rgba(12,45,74,0.6)]">
                        Mobile: {match.maskedMobile}
                      </p>
                    )}
                    {match.maskedEmail && (
                      <p className="text-sm text-[rgba(12,45,74,0.6)]">
                        Email: {match.maskedEmail}
                      </p>
                    )}
                    {match.region && (
                      <p className="text-sm text-[rgba(12,45,74,0.6)]">Region: {match.region}</p>
                    )}
                    <p className="mt-2">
                      <span className="sn-status-badge">Status: {match.accountStatus}</span>
                    </p>
                  </div>
                </div>
                <Link href={`/claim?recordId=${match.id}`} className="mt-6 block">
                  <Button className="w-full">Claim This Account</Button>
                </Link>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="sn-card p-6 text-center">
                <p className="sn-prose text-sm">
                  No record found. You may{" "}
                  <Link href="/register" className="underline">
                    register as a new citizen
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
