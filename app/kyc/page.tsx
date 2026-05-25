"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { KYC_STEPS, DOCUMENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KycApplicationView } from "@/lib/kyc-service";

function KycWizard() {
  const searchParams = useSearchParams();
  const kycId = searchParams.get("kycId") ?? "demo-kyc";
  const [app, setApp] = useState<KycApplicationView | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/kyc/${kycId}`);
    const data = await res.json();
    if (res.ok) {
      setApp(data);
      setActiveStep(Math.max(0, (data.currentStep ?? 1) - 1));
    }
  }, [kycId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitStep(stepKey: string, formData: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/kyc/${kycId}/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepKey, data: formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Step saved.");
      await load();
      setActiveStep((s) => Math.min(s + 1, KYC_STEPS.length - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!app) {
    return <div className="py-24 text-center sn-prose">Loading verification…</div>;
  }

  const step = KYC_STEPS[activeStep];
  const isComplete = app.status === "Approved";

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <span className="sn-status-badge">{app.status}</span>
        <span className="text-sm text-[rgba(12,45,74,0.5)]">
          Step {activeStep + 1} of {KYC_STEPS.length}
        </span>
      </div>

      <div className="mb-8 flex gap-1 overflow-x-auto">
        {KYC_STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`min-w-[4rem] flex-1 rounded-full py-1 text-center text-[10px] md:text-xs ${
              i <= activeStep ? "bg-[var(--sn-blue)] text-white" : "bg-[rgba(12,45,74,0.08)]"
            }`}
          >
            {s.id}
          </div>
        ))}
      </div>

      {isComplete ? (
        <div className="sn-card p-10 text-center">
          <h2 className="text-xl font-semibold text-[var(--sn-blue)]">Verification complete.</h2>
          <p className="mt-4 sn-prose">
            Your sovereign citizen account has been verified and secured.
          </p>
          <a href="https://citizen.sovereignnamibia.com" className="mt-8 inline-block">
            <Button>Enter Citizen Portal</Button>
          </a>
        </div>
      ) : (
        <div className="sn-card p-8">
          <h2 className="text-lg font-semibold text-[var(--sn-blue)]">{step.label}</h2>

          {step.key === "personal" && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                submitStep("personal", Object.fromEntries(fd.entries()));
              }}
            >
              <Input label="Full legal name" name="fullLegalName" required />
              <Input label="Date of birth" name="dateOfBirth" type="date" required />
              <Input label="National ID number" name="nationalId" required />
              <Button type="submit" disabled={loading}>
                Continue
              </Button>
            </form>
          )}

          {step.key === "mobile" && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                submitStep("mobile", Object.fromEntries(fd.entries()));
              }}
            >
              <Input label="Mobile number" name="mobile" required placeholder="+264 ..." />
              <p className="text-xs sn-prose">A verification code will be sent to this number.</p>
              <Button type="submit" disabled={loading}>
                Verify Mobile
              </Button>
            </form>
          )}

          {step.key === "documents" && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                submitStep("documents", {
                  documentType: fd.get("documentType"),
                  frontUploaded: true,
                  backUploaded: !!fd.get("backFile"),
                });
              }}
            >
              <label className="sn-label">Document type</label>
              <select name="documentType" className="sn-input" required>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <Input
                label="Front image or PDF"
                name="frontFile"
                type="file"
                accept="image/*,.pdf"
                required
              />
              <Input label="Back image (if applicable)" name="backFile" type="file" accept="image/*" />
              <p className="text-xs sn-prose">Your documents are encrypted during upload.</p>
              <Button type="submit" disabled={loading}>
                Upload Documents
              </Button>
            </form>
          )}

          {step.key === "selfie" && (
            <div className="mt-6 space-y-4">
              <Input label="Selfie / liveness capture" type="file" accept="image/*" capture="user" />
              <Button
                onClick={() => submitStep("selfie", { selfieCaptured: true })}
                disabled={loading}
              >
                Submit Selfie
              </Button>
            </div>
          )}

          {step.key === "address" && (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                submitStep("address", Object.fromEntries(fd.entries()));
              }}
            >
              <Input label="Street address" name="line1" required />
              <Input label="City" name="city" required />
              <Input label="Region" name="region" required />
              <Input label="Postal code" name="postalCode" />
              <Button type="submit" disabled={loading}>
                Confirm Address
              </Button>
            </form>
          )}

          {step.key === "telecom" && (
            <div className="mt-6 space-y-4">
              <p className="sn-prose text-sm">
                Verify your SIM or eSIM with your mobile network operator.
              </p>
              <Input label="Mobile number" placeholder="+264 ..." />
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => submitStep("telecom", { simType: "SIM" })}
                  disabled={loading}
                >
                  Physical SIM
                </Button>
                <Button
                  variant="outline"
                  onClick={() => submitStep("telecom", { simType: "eSIM" })}
                  disabled={loading}
                >
                  eSIM
                </Button>
              </div>
            </div>
          )}

          {(step.key === "review" || step.key === "approval") && (
            <div className="mt-6 space-y-4">
              <p className="sn-prose text-sm">Your identity is under review.</p>
              <Button
                onClick={() => submitStep("review", { submitted: true })}
                disabled={loading || app.status === "Awaiting Admin Review"}
              >
                Submit for Review
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KycSubdomainPage() {
  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)]">
      <header className="border-b border-[rgba(12,45,74,0.08)] px-6 py-6">
        <p className="sn-eyebrow">kyc.sovereignnamibia.com</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--sn-blue)]">
          Identity Verification
        </h1>
        <p className="mt-2 sn-prose text-sm">Only verified citizens may access this service.</p>
      </header>
      <Suspense fallback={<div className="py-12 text-center">Loading…</div>}>
        <KycWizard />
      </Suspense>
    </div>
  );
}
