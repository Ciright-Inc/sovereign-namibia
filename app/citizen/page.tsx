import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CitizenPortalPage() {
  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)]">
      <header className="border-b border-[rgba(12,45,74,0.08)] px-6 py-6">
        <p className="sn-eyebrow">citizen.sovereignnamibia.com</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--sn-blue)]">Citizen Secure Portal</h1>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-12 md:grid-cols-2">
        {[
          {
            title: "Identity Status",
            body: "View your verification status and account state.",
            href: "https://kyc.sovereignnamibia.com",
          },
          {
            title: "Government Services",
            body: "Access approved digital government services.",
            href: "https://services.sovereignnamibia.com",
          },
          {
            title: "Documents",
            body: "Manage uploaded identity documents securely.",
            href: "#",
          },
          {
            title: "Support",
            body: "Get help with your citizen account.",
            href: "https://support.sovereignnamibia.com",
          },
        ].map((item) => (
          <div key={item.title} className="sn-card p-8">
            <h2 className="text-lg font-semibold text-[var(--sn-blue)]">{item.title}</h2>
            <p className="mt-3 sn-prose text-sm">{item.body}</p>
            <Link href={item.href} className="mt-6 inline-block">
              <Button variant="outline" size="sm">
                Open
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <p className="sn-prose">
          Only verified citizens may access this service. Complete identity verification to activate
          your portal.
        </p>
      </section>
    </div>
  );
}
