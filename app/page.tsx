import Link from "next/link";
import { FadeIn, PageHero } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";

const registrySections = [
  {
    title: "Government Registry",
    body: "Ministries, regulators, courts, municipalities, and state-owned enterprises in a unified sovereign directory.",
    href: "/admin/government",
  },
  {
    title: "Banking Infrastructure",
    body: "Commercial banks, payment platforms, SWIFT codes, branches, and regulatory relationships.",
    href: "/admin/banking",
  },
  {
    title: "Healthcare Systems",
    body: "Hospitals, clinics, laboratories, pharmacies, and healthcare authorities across all regions.",
    href: "/admin/healthcare",
  },
  {
    title: "Business Registry",
    body: "National business records — registration, tax ID, ownership, licenses, and compliance status.",
    href: "/admin/business",
  },
  {
    title: "Citizen Services",
    body: "Privacy-first citizen identity with verification, consent workflows, and encrypted sovereign records.",
    href: "/find-account",
  },
  {
    title: "Infrastructure Networks",
    body: "NAMPOWER, telecom, ports, airports, utilities, and critical national infrastructure assets.",
    href: "/admin/infrastructure",
  },
];

export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow="Sovereign Namibia Registry Network"
        title="Namibia's Trusted Digital Registry Infrastructure"
        subtitle="Secure identity, institutional records, verified infrastructure, and sovereign digital trust for the AI era."
      >
        <Link href="/find-account">
          <Button size="lg">National Registry Search</Button>
        </Link>
        <Link href="/status">
          <Button variant="outline" size="lg">
            Platform Status
          </Button>
        </Link>
      </PageHero>

      <section className="border-y border-[rgba(12,45,74,0.08)] bg-[#0c1a2e] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Sovereign Search</p>
          <h2 className="mt-4 text-2xl font-semibold md:text-3xl">Search the National Registry</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
            Find citizens, businesses, government entities, healthcare facilities, banks, and
            infrastructure — indexed, normalized, and audit-logged.
          </p>
          <Link href="/find-account" className="mt-8 inline-block">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Open Registry Search
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="sn-eyebrow mb-8 text-center">National Registry Domains</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {registrySections.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06}>
                <Link href={item.href} className="sn-card block h-full p-8 transition hover:shadow-md">
                  <h2 className="text-lg font-semibold text-[var(--sn-blue)]">{item.title}</h2>
                  <p className="mt-3 sn-prose text-sm">{item.body}</p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(12,45,74,0.08)] bg-white/40 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <FadeIn>
            <p className="sn-eyebrow">API Ecosystem</p>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--sn-blue)]">
              REST + GraphQL Sovereign Data APIs
            </h2>
            <p className="mt-4 sn-prose text-sm">
              National registry data is API accessible with rate limiting, audit logging, and
              role-based access control. Built for government integration and institutional trust.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="sn-eyebrow">Sovereign Trust Framework</p>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--sn-blue)]">
              Authority, Permanence, and National-Scale Capability
            </h2>
            <p className="mt-4 sn-prose text-sm">
              Encrypted records, immutable audit trails, verification pipelines, and privacy-first
              citizen architecture — designed as critical national infrastructure, not a prototype.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/legal/privacy">
                <Button variant="outline" size="sm">
                  Privacy Policy
                </Button>
              </Link>
              <Link href="/legal/rights">
                <Button variant="outline" size="sm">
                  Citizen Rights
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <FadeIn>
          <p className="sn-eyebrow">Protected Infrastructure</p>
          <h2 className="mt-4 sn-display text-3xl md:text-5xl">Sovereign Digital Trust</h2>
          <p className="mx-auto mt-6 max-w-xl sn-prose">
            A national operating system for identity, institutions, and infrastructure — built for
            the AI era with telecom-grade security architecture.
          </p>
        </FadeIn>
      </section>
    </>
  );
}
