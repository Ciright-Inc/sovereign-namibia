"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Shield, Search, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOUNT_TYPES, NAMIBIA_REGIONS } from "@/lib/constants";
import type { AccountTypeId } from "@/lib/constants";
import type { DirectoryMatchResult } from "@/lib/masking";
import { maskNationalId } from "@/lib/namibia";
import { useKeyraSession } from "@/hooks/use-keyra-session";
import { KeyraObjectBanner } from "@/components/keyra/keyra-object-banner";
import { QrPairingPanel } from "@/components/keyra/qr-pairing-panel";

type Step =
  | "loading"
  | "blocked"
  | "qr-pairing"
  | "welcome"
  | "otp"
  | "account-type"
  | "profile"
  | "search"
  | "results";

export function SovereignAccountFlow() {
  const searchParams = useSearchParams();
  const keyra = useKeyraSession();
  const [step, setStep] = useState<Step>("loading");
  const [signInMode, setSignInMode] = useState(searchParams.get("signin") === "1");
  const [blockedMessage, setBlockedMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [desktopPaired, setDesktopPaired] = useState(false);

  const { apiHeaders, track, requiresQr, isMobilePrimary, sessionId, ready: keyraReady } = keyra;

  const [mobile, setMobile] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [accountType, setAccountType] = useState<AccountTypeId>("individual");
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [registryConsent, setRegistryConsent] = useState(false);

  const [matches, setMatches] = useState<DirectoryMatchResult[]>([]);
  const [resultMessage, setResultMessage] = useState("");
  const [pendingCreated, setPendingCreated] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!keyraReady) return;
    try {
      await track("page_view");
      const res = await fetch("/api/account/access-check", { headers: apiHeaders });
      const data = await res.json();
      if (!res.ok || !data.allowed) {
        setBlockedMessage(
          data.message ??
            "Access to Sovereign Namibia Registry is currently restricted to Namibia-based users. Your visit has been recorded for security review."
        );
        await track("non_namibia_ip_blocked");
        setStep("blocked");
        return;
      }
      await track("namibia_ip_verified");

      const me = await fetch("/api/account/me");
      const session = await me.json();
      if (session.authenticated) {
        if (session.profileComplete) setStep("search");
        else if (session.accountType) {
          setAccountType(session.accountType);
          setStep("profile");
        } else setStep("account-type");
      } else if (requiresQr && !desktopPaired) {
        setStep("qr-pairing");
      } else {
        setStep("welcome");
      }
    } catch {
      setStep(requiresQr ? "qr-pairing" : "welcome");
    }
  }, [apiHeaders, keyraReady, requiresQr, desktopPaired, track]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  async function requestOtp() {
    setLoading(true);
    try {
      await track("create_account_clicked");
      await track("otp_requested");
      const res = await fetch("/api/account/request-otp", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ mobileNumber: mobile, termsAccepted, privacyAccepted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to send code");
      setChallengeId(data.challengeId);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
        toast.message(`Dev OTP: ${data.devOtp}`);
      }
      setStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/verify-otp", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ challengeId, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");

      toast.success("Mobile verified");
      await track("otp_verified");
      if (signInMode && data.profileComplete) {
        setStep("search");
      } else if (data.profileComplete) {
        setStep("search");
      } else if (data.accountType) {
        setAccountType(data.accountType);
        setStep("profile");
      } else {
        setStep("account-type");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/setup", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          accountType,
          profileData: { ...profile, mobileNumber: mobile },
          registryConsent,
          termsAccepted: true,
          privacyAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to save profile");
      toast.success("Account profile saved");
      await track("account_form_completed");
      setStep("search");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setLoading(false);
    }
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!registryConsent) {
      toast.error("Registry lookup consent is required.");
      return;
    }
    setLoading(true);
    setPendingCreated(false);
    try {
      await track("registry_search_started");
      const res = await fetch("/api/directory/search", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          fullLegalName: profile.fullLegalName,
          mobileNumber: mobile,
          dateOfBirth: profile.dateOfBirth,
          nationalId: profile.nationalId,
          email: profile.email,
          businessName: profile.businessLegalName,
          registrationNumber: profile.registrationNumber,
          domain: profile.domain,
          agencyName: profile.agencyName,
          registryConsent: true,
          accountType,
          submittedProfile: { ...profile, mobileNumber: mobile },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setMatches(data.matches ?? []);
      setResultMessage(data.message ?? "");
      setPendingCreated(Boolean(data.pendingVerificationId));
      if ((data.matches?.length ?? 0) > 0) await track("registry_match_found");
      else {
        await track("registry_match_not_found");
        if (data.pendingVerificationId) await track("pending_verification_created");
      }
      await track("registry_search_completed");
      setStep("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function updateProfile(key: string, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  if (step === "loading") {
    return (
      <div className="sn-card mx-auto max-w-xl p-10 text-center">
        <p className="sn-prose text-sm">Checking secure access…</p>
      </div>
    );
  }

  if (step === "blocked") {
    return (
      <div className="sn-card mx-auto max-w-xl border-amber-200 bg-amber-50/80 p-8 text-center">
        <Lock className="mx-auto mb-4 h-8 w-8 text-amber-700" aria-hidden />
        <p className="font-medium text-amber-900">{blockedMessage}</p>
        <p className="mt-3 text-sm text-amber-800/80">
          Access to Sovereign Namibia Registry is currently restricted to Namibia-based users. Your visit has been recorded for security review.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 sm:px-6">
      <KeyraObjectBanner />

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-xs text-[rgba(12,45,74,0.45)]">
        {["Verify", "Account", "Search"].map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            <span
              className={
                (step === "welcome" || step === "otp") && i === 0
                  ? "font-medium text-[var(--sn-blue)]"
                  : (step === "account-type" || step === "profile") && i === 1
                    ? "font-medium text-[var(--sn-blue)]"
                    : (step === "search" || step === "results") && i === 2
                      ? "font-medium text-[var(--sn-blue)]"
                      : ""
              }
            >
              {label}
            </span>
          </span>
        ))}
      </div>

      {step === "qr-pairing" && (
        <QrPairingPanel
          sessionId={sessionId}
          apiHeaders={apiHeaders}
          track={track}
          onPaired={(data) => {
            setDesktopPaired(true);
            if (data.profileComplete) setStep("search");
            else if (data.accountType) {
              setAccountType(data.accountType as AccountTypeId);
              setStep("profile");
            } else setStep("account-type");
          }}
        />
      )}

      {step === "welcome" && isMobilePrimary && (
        <div className="sn-card space-y-6 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sn-gold)]" aria-hidden />
            <p className="text-sm leading-relaxed text-[rgba(12,45,74,0.65)]">
              Namibia mobile numbers only (+264). Your session is secured after OTP verification.
            </p>
          </div>
          <Input
            label="Namibia mobile number"
            name="mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+264 81 123 4567"
            autoComplete="tel"
            required
          />
          <label className="flex items-start gap-3 text-sm text-[rgba(12,45,74,0.7)]">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className="underline">
                Terms of Use
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-[rgba(12,45,74,0.7)]">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/privacy" className="underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          <Button
            type="button"
            className="w-full"
            disabled={loading || !mobile || !termsAccepted || !privacyAccepted}
            onClick={requestOtp}
          >
            {loading ? "Sending…" : "Verify Mobile Number"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setSignInMode(true);
              requestOtp();
            }}
            disabled={loading || !mobile || !termsAccepted || !privacyAccepted}
          >
            Already Verified? Sign In
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="sn-card space-y-6 p-6 sm:p-8">
          <p className="sn-prose text-sm">
            Enter the 6-digit code sent to <strong>{mobile}</strong>.
          </p>
          {devOtpHint && (
            <p className="rounded-lg bg-[rgba(12,45,74,0.06)] px-4 py-2 text-xs text-[rgba(12,45,74,0.6)]">
              Development code: {devOtpHint}
            </p>
          )}
          <Input
            label="Verification code"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            required
          />
          <Button type="button" className="w-full" disabled={loading || otp.length !== 6} onClick={verifyOtp}>
            {loading ? "Verifying…" : "Confirm Code"}
          </Button>
          <button type="button" className="w-full text-sm text-[rgba(12,45,74,0.5)] underline" onClick={() => setStep("welcome")}>
            Use a different number
          </button>
        </div>
      )}

      {step === "account-type" && (
        <div className="sn-card space-y-4 p-6 sm:p-8">
          <h2 className="font-semibold text-[var(--sn-blue)]">What type of account are you creating?</h2>
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setAccountType(type.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  accountType === type.id
                    ? "border-[var(--sn-blue)] bg-[rgba(12,45,74,0.06)] text-[var(--sn-blue)]"
                    : "border-[rgba(12,45,74,0.12)] hover:border-[rgba(12,45,74,0.25)]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              track("account_type_selected", { account_type: accountType });
              setStep("profile");
            }}
          >
            Continue
          </Button>
        </div>
      )}

      {step === "profile" && (
        <div className="sn-card space-y-5 p-6 sm:p-8">
          <h2 className="font-semibold text-[var(--sn-blue)]">Account details</h2>
          {accountType === "individual" && (
            <>
              <Input label="Full legal name" value={profile.fullLegalName ?? ""} onChange={(e) => updateProfile("fullLegalName", e.target.value)} required />
              <Input label="Date of birth" type="date" value={profile.dateOfBirth ?? ""} onChange={(e) => updateProfile("dateOfBirth", e.target.value)} required />
              <Input label="National ID number" value={profile.nationalId ?? ""} onChange={(e) => updateProfile("nationalId", e.target.value)} required hint={`Stored securely. Display masked: ${profile.nationalId ? maskNationalId(profile.nationalId) : "********1234"}`} />
              <Input label="Residential address" value={profile.residentialAddress ?? ""} onChange={(e) => updateProfile("residentialAddress", e.target.value)} required />
              <label className="sn-label">Region</label>
              <select className="sn-input" value={profile.region ?? ""} onChange={(e) => updateProfile("region", e.target.value)} required>
                <option value="">Select region</option>
                {NAMIBIA_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Input label="Email" type="email" value={profile.email ?? ""} onChange={(e) => updateProfile("email", e.target.value)} required />
              <Input label="Employer (optional)" value={profile.employer ?? ""} onChange={(e) => updateProfile("employer", e.target.value)} />
            </>
          )}
          {(accountType === "business" || accountType === "financial" || accountType === "utility" || accountType === "healthcare") && (
            <>
              <Input label="Business legal name" value={profile.businessLegalName ?? ""} onChange={(e) => updateProfile("businessLegalName", e.target.value)} required />
              <Input label="Registration number" value={profile.registrationNumber ?? ""} onChange={(e) => updateProfile("registrationNumber", e.target.value)} required />
              <Input label="Tax ID" value={profile.taxId ?? ""} onChange={(e) => updateProfile("taxId", e.target.value)} required />
              <Input label="Domain / website" value={profile.domain ?? ""} onChange={(e) => updateProfile("domain", e.target.value)} />
              <Input label="Business address" value={profile.businessAddress ?? ""} onChange={(e) => updateProfile("businessAddress", e.target.value)} required />
              <Input label="Industry" value={profile.industry ?? ""} onChange={(e) => updateProfile("industry", e.target.value)} required />
              <Input label="Authorized representative" value={profile.representativeName ?? ""} onChange={(e) => updateProfile("representativeName", e.target.value)} required />
              <Input label="Representative mobile" value={profile.representativeMobile ?? mobile} onChange={(e) => updateProfile("representativeMobile", e.target.value)} required />
              <Input label="Representative email" type="email" value={profile.representativeEmail ?? ""} onChange={(e) => updateProfile("representativeEmail", e.target.value)} required />
              <Input label="Proof of authorization" type="file" onChange={(e) => updateProfile("authorizationProof", e.target.files?.[0]?.name ?? "")} />
            </>
          )}
          {(accountType === "government" || accountType === "government_office") && (
            <>
              <Input label="Ministry / department / agency name" value={profile.agencyName ?? ""} onChange={(e) => updateProfile("agencyName", e.target.value)} required />
              <Input label="Office type" value={profile.officeType ?? ""} onChange={(e) => updateProfile("officeType", e.target.value)} required />
              <Input label="Official domain" value={profile.officialDomain ?? ""} onChange={(e) => updateProfile("officialDomain", e.target.value)} />
              <Input label="Physical address" value={profile.physicalAddress ?? ""} onChange={(e) => updateProfile("physicalAddress", e.target.value)} required />
              <Input label="Authorized officer" value={profile.officerName ?? ""} onChange={(e) => updateProfile("officerName", e.target.value)} required />
              <Input label="Officer title" value={profile.officerTitle ?? ""} onChange={(e) => updateProfile("officerTitle", e.target.value)} required />
              <Input label="Officer mobile" value={profile.officerMobile ?? mobile} onChange={(e) => updateProfile("officerMobile", e.target.value)} required />
              <Input label="Officer email" type="email" value={profile.officerEmail ?? ""} onChange={(e) => updateProfile("officerEmail", e.target.value)} required />
              <Input label="Verification document" type="file" onChange={(e) => updateProfile("verificationDocument", e.target.files?.[0]?.name ?? "")} />
            </>
          )}
          <label className="flex items-start gap-3 text-sm text-[rgba(12,45,74,0.7)]">
            <input type="checkbox" checked={registryConsent} onChange={(e) => setRegistryConsent(e.target.checked)} className="mt-1" />
            <span>I consent to secure registry lookup using my verified account information.</span>
          </label>
          <Button type="button" className="w-full" disabled={loading} onClick={saveProfile}>
            {loading ? "Saving…" : "Save & Continue to Search"}
          </Button>
        </div>
      )}

      {step === "search" && (
        <form onSubmit={runSearch} className="sn-card space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[var(--sn-blue)]">
            <Search className="h-5 w-5" aria-hidden />
            <h2 className="font-semibold">Search the national registry</h2>
          </div>
          <p className="text-sm text-[rgba(12,45,74,0.6)]">
            Authenticated search using your verified account. Sensitive fields remain masked unless you own the record.
          </p>
          <Input label="Search name" value={profile.fullLegalName ?? profile.businessLegalName ?? profile.agencyName ?? ""} onChange={(e) => updateProfile("fullLegalName", e.target.value)} required />
          <Input label="Mobile number" value={mobile} readOnly />
          {profile.nationalId && (
            <p className="text-xs text-[rgba(12,45,74,0.5)]">National ID: {maskNationalId(profile.nationalId)}</p>
          )}
          <label className="flex items-start gap-3 text-sm text-[rgba(12,45,74,0.7)]">
            <input type="checkbox" checked={registryConsent} onChange={(e) => setRegistryConsent(e.target.checked)} className="mt-1" required />
            <span>I consent to this registry lookup under the Privacy Policy and Terms of Use.</span>
          </label>
          <Button type="submit" className="w-full" disabled={loading || !registryConsent}>
            {loading ? "Searching…" : "Search Registry"}
          </Button>
        </form>
      )}

      {step === "results" && (
        <div className="space-y-4">
          <p className="sn-prose text-center text-sm">{resultMessage}</p>
          {pendingCreated && (
            <div className="sn-card border-[rgba(196,163,90,0.2)] bg-[rgba(196,163,90,0.06)] p-6 text-center">
              <p className="font-medium text-[var(--sn-blue)]">
                No verified registry record was found. We will index your submitted information for verification.
              </p>
              <p className="mt-2 text-sm text-[rgba(12,45,74,0.6)]">
                Status: Pending · Review: Unreviewed
              </p>
            </div>
          )}
          {matches.map((match) => (
            <div key={match.id} className="sn-card p-6">
              <p className="font-medium text-[var(--sn-blue)]">{match.maskedName}</p>
              {match.maskedMobile && <p className="mt-1 text-sm text-[rgba(12,45,74,0.6)]">Mobile: {match.maskedMobile}</p>}
              {match.maskedEmail && <p className="text-sm text-[rgba(12,45,74,0.6)]">Email: {match.maskedEmail}</p>}
              {match.region && <p className="text-sm text-[rgba(12,45,74,0.6)]">Region: {match.region}</p>}
              <p className="mt-2"><span className="sn-status-badge">Status: {match.accountStatus}</span></p>
              <Link href={`/claim?recordId=${match.id}`} className="mt-4 block">
                <Button className="w-full">Claim This Account</Button>
              </Link>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={() => setStep("search")}>
            Search Again
          </Button>
        </div>
      )}
    </div>
  );
}
