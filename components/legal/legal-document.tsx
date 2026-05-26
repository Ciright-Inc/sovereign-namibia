import type { LegalSection } from "@/lib/legal-content";
import { LegalSections } from "@/components/legal/legal-sections";

type LegalDocumentProps = {
  sections: LegalSection[];
  lastUpdated?: string;
  variant?: "light" | "dark";
};

export function LegalDocument({
  sections,
  lastUpdated,
  variant = "dark",
}: LegalDocumentProps) {
  const isDark = variant === "dark";

  return (
    <article
      className={isDark ? "sn-legal-document" : "mx-auto max-w-3xl px-6 pb-24"}
      itemScope
      itemType="https://schema.org/WebPage"
    >
      {lastUpdated && (
        <p
          className={
            isDark
              ? "mb-8 text-sm text-[rgba(248,246,242,0.45)]"
              : "mb-8 text-sm text-[rgba(12,45,74,0.5)]"
          }
        >
          Last updated:{" "}
          <time itemProp="dateModified" dateTime={lastUpdated}>
            {new Date(lastUpdated).toLocaleDateString("en-NA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </p>
      )}
      <LegalSections sections={sections} variant={variant} />
    </article>
  );
}
