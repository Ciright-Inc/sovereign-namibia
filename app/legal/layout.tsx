import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Legal & Governance",
    template: "%s | Sovereign Namibia",
  },
  description:
    "Constitutional, privacy, and governance documentation for Sovereign Namibia — Namibia's sovereign digital identity platform.",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sn-legal-layout min-h-screen bg-[#060e18]">{children}</div>
  );
}
