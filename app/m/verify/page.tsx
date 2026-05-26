"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyraObjectBanner } from "@/components/keyra/keyra-object-banner";
import { getDeviceFingerprint } from "@/lib/keyra-client-device";

function MobileVerifyContent() {
  const params = useSearchParams();
  const pairing = params.get("pairing") ?? "";
  const nonce = params.get("nonce") ?? "";

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [step, setStep] = useState<"mobile" | "otp" | "done">("mobile");
  const [loading, setLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-device-fingerprint": getDeviceFingerprint(),
  };

  async function scanQr() {
    await fetch("/api/keyra/qr/scan", {
      method: "POST",
      headers,
      body: JSON.stringify({ pairing_token: pairing, nonce }),
    });
  }

  async function requestOtp() {
    setLoading(true);
    try {
      await scanQr();
      const res = await fetch("/api/account/request-otp", {
        method: "POST",
        headers,
        body: JSON.stringify({ mobileNumber: mobile, termsAccepted: true, privacyAccepted: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChallengeId(data.challengeId);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/verify-otp", {
        method: "POST",
        headers,
        body: JSON.stringify({ challengeId, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetch("/api/keyra/qr/pair", {
        method: "POST",
        headers,
        body: JSON.stringify({ pairing_token: pairing, user_id: data.userId }),
      });

      setStep("done");
      toast.success("Mobile verified. Return to your desktop to continue.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (!pairing) {
    return <p className="p-8 text-center text-sm">Invalid KEYRA verification link.</p>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <KeyraObjectBanner />
      <div className="sn-card space-y-5 p-6">
        <div className="flex items-center gap-2 text-[var(--sn-blue)]">
          <Shield className="h-5 w-5" />
          <h1 className="font-semibold">KEYRA Mobile Verification</h1>
        </div>
        <p className="text-sm text-[rgba(12,45,74,0.65)]">
          Certify your Namibia mobile number to pair with your desktop session.
        </p>

        {step === "mobile" && (
          <>
            <Input label="Namibia mobile (+264)" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+264 81 123 4567" />
            <Button className="w-full" disabled={loading} onClick={requestOtp}>Send OTP</Button>
          </>
        )}

        {step === "otp" && (
          <>
            {devOtp && <p className="text-xs text-[rgba(12,45,74,0.5)]">Dev OTP: {devOtp}</p>}
            <Input label="Verification code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            <Button className="w-full" disabled={loading || otp.length !== 6} onClick={verifyOtp}>Verify & Pair</Button>
          </>
        )}

        {step === "done" && (
          <div className="rounded-lg bg-emerald-50 p-4 text-center text-sm text-emerald-900">
            Desktop pairing complete. You may close this page and continue on your computer.
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobileVerifyPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading KEYRA verification…</p>}>
      <MobileVerifyContent />
    </Suspense>
  );
}
