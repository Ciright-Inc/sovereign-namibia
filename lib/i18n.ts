export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "osh", label: "Oshiwambo" },
  { id: "af", label: "Afrikaans" },
  { id: "naq", label: "Khoekhoegowab" },
  { id: "hz", label: "Otjiherero" },
  { id: "kj", label: "Rukwangali" },
  { id: "loz", label: "Silozi" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

type Dict = Record<string, string>;

// NOTE: For many civic terms, there is no single standardized translation across dialects.
// We keep non-English translations minimal, respectful, and conservative.
const DICTS: Record<LanguageId, Dict> = {
  en: {
    platformTitle: "Namibia Digital Identity & Infrastructure Map",
    platformSubtitle:
      "Empowering Namibia’s people, communities, regions, businesses, and infrastructure through a secure, trusted, inclusive, and nationally owned digital platform.",
    viewMap: "View Map",
    trustDashboard: "Trust Dashboard",
    yourRights: "Your Rights",
    lowBandwidth: "Low-bandwidth mode",
    searchPins: "Search pins…",
    filterRegion: "Filter by region",
    filterType: "Filter by type",
    publicOnly: "Public pins only",
    submitCorrection: "Submit a correction",
    correctionSubmitted: "Correction submitted",
    loading: "Loading…",
    mapPins: "Map Pins",
    verified: "Verified",
    pending: "Pending",
    restricted: "Restricted",
    language: "Language",
    highContrast: "High contrast",
  },
  // Minimal UI translations (proper nouns like regions remain unchanged).
  osh: {
    platformTitle: "Namibia Digital Map",
    viewMap: "Tala Map",
    trustDashboard: "Trust Dashboard",
    yourRights: "Omakelo Goye",
    loading: "Okutunda…",
    language: "Oshiwanawa",
  },
  af: {
    platformTitle: "Namibië Digitale Kaart",
    viewMap: "Sien kaart",
    trustDashboard: "Vertrouenspaneel",
    yourRights: "Jou Regte",
    loading: "Laai…",
    language: "Taal",
    highContrast: "Hoë kontras",
  },
  naq: {
    platformTitle: "Namibia Digital Map",
    viewMap: "Khaisa Map",
    trustDashboard: "Trust Dashboard",
    yourRights: "ǁGâi ǂNâ",
    loading: "Loading…",
    language: "Language",
  },
  hz: {
    platformTitle: "Namibia Digital Map",
    viewMap: "Tjina Map",
    trustDashboard: "Trust Dashboard",
    yourRights: "Ovitjivaro Vyoye",
    loading: "Loading…",
    language: "Language",
  },
  kj: {
    platformTitle: "Namibia Digital Map",
    viewMap: "Tjita Map",
    trustDashboard: "Trust Dashboard",
    yourRights: "Ovihanga Vyoye",
    loading: "Loading…",
    language: "Language",
  },
  loz: {
    platformTitle: "Namibia Digital Map",
    viewMap: "Bona Map",
    trustDashboard: "Trust Dashboard",
    yourRights: "Litokelo Zenu",
    loading: "Loading…",
    language: "Puo",
  },
};

export function t(lang: LanguageId, key: keyof (typeof DICTS)["en"]): string {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? String(key);
}

export function getLangFromParam(value: string | null | undefined): LanguageId {
  const id = (value ?? "").toLowerCase();
  const found = LANGUAGES.find((l) => l.id === id);
  return (found?.id ?? "en") as LanguageId;
}

