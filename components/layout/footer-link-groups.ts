import type { LegalSlug } from "@/lib/legal-slugs";

export type FooterLink = {
  href: string;
  label: string;
  slug?: LegalSlug;
  external?: boolean;
  description?: string;
};

export const FOOTER_LEGAL_LINKS: FooterLink[] = [
  {
    href: "/legal/privacy",
    label: "Privacy Policy",
    slug: "privacy",
    description: "Data ownership, encryption, and lawful processing",
  },
  {
    href: "/legal/terms",
    label: "Terms of Use",
    slug: "terms",
    description: "Sovereign platform governance and acceptable use",
  },
  {
    href: "/legal/rights",
    label: "Citizen Rights",
    slug: "rights",
    description: "Constitutional protections in the digital age",
  },
];

export const FOOTER_STATUS_LINK: FooterLink = {
  href: process.env.NEXT_PUBLIC_STATUS_URL ?? "/status",
  label: "System Status",
  external: Boolean(process.env.NEXT_PUBLIC_STATUS_URL?.startsWith("http")),
  description: "Live infrastructure health and incident reporting",
};

export const FOOTER_PLATFORM_LINKS: FooterLink[] = [
  { href: "/find-account", label: "Find My Account" },
  { href: "/register", label: "Register" },
  { href: "/map", label: "National Map", description: "Interactive infrastructure + opportunity map" },
  { href: "/trust", label: "Trust Dashboard", description: "Transparency metrics and citizen rights" },
  { href: "https://support.sovereignnamibia.com", label: "Support", external: true },
];
