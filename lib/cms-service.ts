import { isDatabaseReady, query } from "@/lib/db";

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  pageType: string;
  status: string;
  language: string;
  featured: boolean;
  emergencyAlert: boolean;
  seoTitle?: string;
  seoDescription?: string;
  publishDate?: string;
};

export type CmsArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: Record<string, unknown>;
  category?: string;
  iframeUrl?: string;
  status: string;
  featured: boolean;
  emergencyAlert: boolean;
  publishDate?: string;
};

const DEMO_PAGES: CmsPage[] = [
  {
    id: "home",
    slug: "home",
    title: "Sovereign Digital Identity for Namibia",
    content: {
      hero: "Your trusted national digital identity.",
      subtitle:
        "Find your citizen identity record. Claim and secure your account. Access government services with confidence.",
      notices: [
        {
          title: "National Digital Identity Programme",
          body: "Citizens may now search for and claim pre-created identity records.",
          emergency: false,
        },
      ],
    },
    pageType: "homepage",
    status: "published",
    language: "en",
    featured: true,
    emergencyAlert: false,
    seoTitle: "Sovereign Namibia — National Digital Identity",
    seoDescription: "Official sovereign digital identity platform for Namibian citizens.",
  },
  {
    id: "privacy",
    slug: "privacy",
    title: "Privacy Policy",
    content: {
      body: "Your information is protected. All identity data is encrypted at rest. Directory search returns only masked, privacy-safe results.",
    },
    pageType: "legal",
    status: "published",
    language: "en",
    featured: false,
    emergencyAlert: false,
  },
  {
    id: "kyc-instructions",
    slug: "kyc-instructions",
    title: "Identity Verification Instructions",
    content: {
      steps: [
        "Prepare your National ID, Driver's License, or Passport.",
        "Ensure good lighting for document photos and selfie verification.",
        "Have your registered mobile number available for OTP verification.",
        "Complete telecom SIM/eSIM verification when prompted.",
      ],
    },
    pageType: "kyc",
    status: "published",
    language: "en",
    featured: false,
    emergencyAlert: false,
  },
];

const DEMO_ARTICLES: CmsArticle[] = [
  {
    id: "article-1",
    slug: "digital-identity-launch",
    title: "Namibia Launches Sovereign Digital Identity Platform",
    excerpt: "Citizens can now find and claim their national digital identity records.",
    content: { body: "The Sovereign Namibia platform enables secure citizen identity verification." },
    category: "National Notices",
    status: "published",
    featured: true,
    emergencyAlert: false,
    publishDate: new Date().toISOString(),
  },
  {
    id: "article-2",
    slug: "telecom-partnership",
    title: "Telecom Partners Support SIM Verification",
    excerpt: "Mobile network operators join the national identity verification programme.",
    content: { body: "Telecom verification strengthens citizen account security." },
    category: "Telecom",
    status: "published",
    featured: false,
    emergencyAlert: false,
    publishDate: new Date().toISOString(),
  },
];

export async function getPublishedPage(slug: string, language = "en"): Promise<CmsPage | null> {
  if (!(await isDatabaseReady())) {
    return DEMO_PAGES.find((p) => p.slug === slug && p.language === language) ?? null;
  }

  const result = await query<{
    id: string;
    slug: string;
    title: string;
    content: Record<string, unknown>;
    page_type: string;
    status: string;
    language: string;
    featured: boolean;
    emergency_alert: boolean;
    seo_title: string | null;
    seo_description: string | null;
    publish_date: string | null;
  }>(
    `SELECT id, slug, title, content, page_type, status, language, featured, emergency_alert,
            seo_title, seo_description, publish_date
     FROM sn_cms_pages
     WHERE slug = $1 AND language = $2 AND status = 'published'
       AND (publish_date IS NULL OR publish_date <= NOW())
       AND (expiration_date IS NULL OR expiration_date > NOW())
     ORDER BY version DESC LIMIT 1`,
    [slug, language]
  );

  const row = result.rows[0];
  if (!row) return DEMO_PAGES.find((p) => p.slug === slug) ?? null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    pageType: row.page_type,
    status: row.status,
    language: row.language,
    featured: row.featured,
    emergencyAlert: row.emergency_alert,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    publishDate: row.publish_date ?? undefined,
  };
}

export async function getPublishedArticles(limit = 10): Promise<CmsArticle[]> {
  if (!(await isDatabaseReady())) {
    return DEMO_ARTICLES.slice(0, limit);
  }

  const result = await query<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: Record<string, unknown>;
    category: string | null;
    iframe_url: string | null;
    status: string;
    featured: boolean;
    emergency_alert: boolean;
    publish_date: string | null;
  }>(
    `SELECT id, slug, title, excerpt, content, category, iframe_url, status, featured, emergency_alert, publish_date
     FROM sn_cms_articles
     WHERE status = 'published'
       AND (publish_date IS NULL OR publish_date <= NOW())
       AND (expiration_date IS NULL OR expiration_date > NOW())
     ORDER BY featured DESC, publish_date DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );

  if (result.rows.length === 0) return DEMO_ARTICLES.slice(0, limit);

  return result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    content: row.content,
    category: row.category ?? undefined,
    iframeUrl: row.iframe_url ?? undefined,
    status: row.status,
    featured: row.featured,
    emergencyAlert: row.emergency_alert,
    publishDate: row.publish_date ?? undefined,
  }));
}

export async function getEmergencyAlerts(): Promise<CmsPage[]> {
  if (!(await isDatabaseReady())) {
    return DEMO_PAGES.filter((p) => p.emergencyAlert);
  }

  const result = await query<{ slug: string }>(
    `SELECT slug FROM sn_cms_pages
     WHERE emergency_alert = TRUE AND status = 'published'
       AND (expiration_date IS NULL OR expiration_date > NOW())`
  );

  const alerts: CmsPage[] = [];
  for (const row of result.rows) {
    const page = await getPublishedPage(row.slug);
    if (page) alerts.push(page);
  }
  return alerts;
}

export { DEMO_PAGES, DEMO_ARTICLES };
