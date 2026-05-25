import { notFound } from "next/navigation";
import { getPublishedPage } from "@/lib/cms-service";
import { PageHero } from "@/components/ui/motion";

const LEGAL_SLUGS: Record<string, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Use",
  rights: "Citizen Rights",
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublishedPage(slug === "privacy" ? "privacy" : slug);

  if (!page && !LEGAL_SLUGS[slug]) notFound();

  const content = page?.content as { body?: string } | undefined;
  const title = page?.title ?? LEGAL_SLUGS[slug];

  const defaultBodies: Record<string, string> = {
    privacy:
      "Your information is protected. All identity data is encrypted at rest. Directory search returns only masked, privacy-safe results. Uploaded documents are stored with encryption and accessible only to authorized reviewers.",
    terms:
      "Use of the Sovereign Namibia platform is governed by national digital identity regulations. Citizens must provide accurate information during verification. Misrepresentation may result in account suspension.",
    rights:
      "Every Namibian citizen has the right to access their digital identity record, request corrections, and understand how their data is used. Contact support for assistance with your citizen rights.",
  };

  return (
    <>
      <PageHero eyebrow="Legal" title={title} />
      <article className="mx-auto max-w-3xl px-6 pb-24 sn-prose">
        <p>{content?.body ?? defaultBodies[slug]}</p>
      </article>
    </>
  );
}
