import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal/legal-document";
import { ConstitutionalViewer } from "@/components/legal/constitutional-viewer";
import { getLegalContent } from "@/lib/legal-content";
import { LEGAL_SLUGS, isLegalSlug } from "@/lib/legal-slugs";
import { getPublishedPage } from "@/lib/cms-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return {};

  const meta = LEGAL_SLUGS[slug];
  return {
    title: meta.title,
    description: meta.description,
    keywords: [
      "Sovereign Namibia",
      "Namibia",
      meta.title,
      "Constitution",
      "digital governance",
      "citizen rights",
      "privacy",
    ],
    openGraph: {
      title: `${meta.title} | Sovereign Namibia`,
      description: meta.description,
      type: "website",
    },
    alternates: {
      canonical: `/legal/${slug}`,
    },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();

  const meta = LEGAL_SLUGS[slug];
  const cmsPage = await getPublishedPage(slug === "privacy" ? "privacy" : slug);
  const cmsBody = (cmsPage?.content as { body?: string } | undefined)?.body;
  const sections = getLegalContent(slug);

  return (
    <div className="sn-legal-page">
      <section className="sn-legal-hero relative px-6 pb-12 pt-16 md:pb-16 md:pt-24">
        <div className="sn-legal-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl">
          <p className="sn-footer-eyebrow">Legal &amp; Constitutional Framework</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--sn-gold)] md:text-5xl">
            {meta.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[rgba(248,246,242,0.55)]">
            {meta.description}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-24">
        {cmsBody && (
          <div className="mb-8 rounded-xl border border-[rgba(196,163,90,0.1)] bg-[rgba(255,255,255,0.03)] p-6">
            <p className="text-sm leading-relaxed text-[rgba(248,246,242,0.65)]">{cmsBody}</p>
          </div>
        )}

        <LegalDocument sections={sections} lastUpdated={meta.lastUpdated} variant="dark" />

        {slug === "rights" && (
          <div className="mt-12">
            <ConstitutionalViewer />
          </div>
        )}
      </div>
    </div>
  );
}
