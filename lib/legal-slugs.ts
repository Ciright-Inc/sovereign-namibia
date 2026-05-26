export const LEGAL_SLUGS = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    description:
      "How Sovereign Namibia collects, protects, and processes citizen data in accordance with the Constitution of Namibia and applicable national legislation.",
    lastUpdated: "2026-05-01",
  },
  terms: {
    slug: "terms",
    title: "Terms of Use",
    description:
      "Constitutionally aligned terms governing use of Namibia's sovereign digital identity and governance platform.",
    lastUpdated: "2026-05-01",
  },
  rights: {
    slug: "rights",
    title: "Your Rights as a Namibian Citizen",
    description:
      "Constitutional rights, digital protections, and how Sovereign Namibia upholds dignity, privacy, and lawful administration.",
    lastUpdated: "2026-05-01",
  },
} as const;

export type LegalSlug = keyof typeof LEGAL_SLUGS;

export function isLegalSlug(slug: string): slug is LegalSlug {
  return slug in LEGAL_SLUGS;
}
