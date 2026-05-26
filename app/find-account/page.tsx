import Link from "next/link";
import { Suspense } from "react";
import { SovereignAccountFlow } from "@/components/account/sovereign-account-flow";

export default function FindAccountPage() {
  return (
    <>
      <section className="keyra-hero relative px-4 pb-10 pt-16 sm:px-6 md:pb-14 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="sn-eyebrow">Republic of Namibia · Sovereign Registry</p>
          <h1 className="sn-display mt-4 text-[clamp(2rem,5vw,3.25rem)]">
            Create Your Sovereign Namibia Account
          </h1>
          <p className="mx-auto mt-5 max-w-2xl sn-prose text-base sm:text-lg">
            Verify your Namibia mobile number to securely access the national registry, search for
            your record, or submit information for verification.
          </p>
          <p className="mx-auto mt-3 max-w-xl font-mono text-xs text-[rgba(12,45,74,0.45)]">
            KEYRA Trust Object · keyra.ie/countries/namibia/sovereign-registry
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="sn-btn sn-btn-outline w-full sm:w-auto"
            >
              Create Account (Full Registration)
            </Link>
            <Link href="/admin" className="text-sm text-[rgba(12,45,74,0.55)] underline hover:text-[var(--sn-blue)]">
              Admin
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="mx-auto max-w-xl p-10 text-center sn-prose text-sm">Loading secure access…</div>}>
        <SovereignAccountFlow />
      </Suspense>
    </>
  );
}
