import Link from "next/link";
import { Button } from "@/components/ui/button";

const SERVICES = [
  { name: "Digital Identity", status: "Active", requiresKyc: true },
  { name: "Tax Registration Lookup", status: "Coming Soon", requiresKyc: true },
  { name: "Voter Registration Status", status: "Active", requiresKyc: true },
  { name: "Driver License Renewal", status: "Pilot", requiresKyc: true },
  { name: "Social Grant Verification", status: "Active", requiresKyc: true },
  { name: "Business Registration Portal", status: "Coming Soon", requiresKyc: false },
];

export default function ServicesSubdomainPage() {
  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)]">
      <header className="border-b border-[rgba(12,45,74,0.08)] px-6 py-8">
        <p className="sn-eyebrow">services.sovereignnamibia.com</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sn-blue)]">Government Services</h1>
        <p className="mt-4 max-w-2xl sn-prose">
          Access approved digital government services with your verified sovereign identity.
        </p>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-4">
          {SERVICES.map((service) => (
            <div
              key={service.name}
              className="sn-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="font-medium text-[var(--sn-blue)]">{service.name}</h2>
                <p className="mt-1 text-sm text-[rgba(12,45,74,0.55)]">
                  {service.requiresKyc
                    ? "Requires verified citizen identity"
                    : "Public information service"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="sn-status-badge">{service.status}</span>
                {service.requiresKyc ? (
                  <Link href="https://citizen.sovereignnamibia.com">
                    <Button size="sm" variant="outline">
                      Access
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
