"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHero } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STEPS = [
  "Confirm record",
  "Verify mobile",
  "Enter OTP",
  "Begin verification",
] as const;

function ClaimFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const recordId = searchParams.get("recordId") ?? "";

  const [step, setStep] = useState(0);
  const [claimId, setClaimId] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function startClaim() {
    if (!recordId) {
      toast.error("No record selected.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/claim/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryRecordId: recordId, mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start claim");
      setClaimId(data.claimId);
      if (data.devOtp) toast.message(`Verification code (dev): ${data.devOtp}`);
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    try {
      const res = await fetch("/api/claim/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message ?? "Invalid code");
      toast.success("Mobile number verified.");
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function beginKyc() {
    setLoading(true);
    try {
      const res = await fetch("/api/claim/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, recordId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/kyc?kycId=${data.kycId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!recordId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center sn-prose">
        No record selected. Please search the directory first.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-6 pb-24">
      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[var(--sn-blue)]" : "bg-[rgba(12,45,74,0.1)]"}`}
          />
        ))}
      </div>

      <div className="sn-card p-8">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-[var(--sn-blue)]">Confirm your record</h2>
            <p className="mt-2 sn-prose text-sm">
              You are claiming citizen record <code className="text-xs">{recordId}</code>. Only
              proceed if this match is yours.
            </p>
            <Button className="mt-6 w-full" onClick={() => setStep(1)}>
              Continue
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-[var(--sn-blue)]">Confirm mobile number</h2>
            <p className="mt-2 sn-prose text-sm">
              Enter the mobile number associated with this citizen record.
            </p>
            <div className="mt-6">
              <Input
                label="Mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+264 ..."
                required
              />
            </div>
            <Button className="mt-6 w-full" onClick={startClaim} disabled={loading || !mobile}>
              Send Verification Code
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-[var(--sn-blue)]">Enter verification code</h2>
            <p className="mt-2 sn-prose text-sm">A one-time code was sent to your mobile number.</p>
            <div className="mt-6">
              <Input
                label="OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
              />
            </div>
            <Button className="mt-6 w-full" onClick={verifyOtp} disabled={loading || otp.length < 6}>
              Verify Code
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-[var(--sn-blue)]">Begin identity verification</h2>
            <p className="mt-2 sn-prose text-sm">
              Your mobile number is verified. Complete KYC to activate your sovereign citizen
              account.
            </p>
            <Button className="mt-6 w-full" onClick={beginKyc} disabled={loading}>
              Continue to KYC
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

export default function ClaimPage() {
  return (
    <>
      <PageHero
        eyebrow="Account Claim"
        title="Claim and secure your account."
        subtitle="Your documents are encrypted during upload. Verification protects your sovereign identity."
      />
      <Suspense fallback={<div className="px-6 py-12 text-center">Loading…</div>}>
        <ClaimFlow />
      </Suspense>
    </>
  );
}
