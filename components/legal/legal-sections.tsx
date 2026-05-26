"use client";

import { ChevronDown } from "lucide-react";
import type { LegalSection } from "@/lib/legal-content";
import { cn } from "@/lib/utils";

type LegalSectionsProps = {
  sections: LegalSection[];
  variant?: "light" | "dark";
};

export function LegalSections({ sections, variant = "dark" }: LegalSectionsProps) {
  const isDark = variant === "dark";

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <details
          key={section.id}
          className={cn(
            "group sn-legal-section overflow-hidden transition-all duration-300",
            isDark
              ? "rounded-xl border border-[rgba(196,163,90,0.1)] bg-[rgba(255,255,255,0.03)] backdrop-blur-md"
              : "sn-card"
          )}
          open={index === 0}
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 transition hover:bg-[rgba(255,255,255,0.02)] [&::-webkit-details-marker]:hidden",
              isDark ? "text-[var(--sn-gold)]" : "text-[var(--sn-blue)]"
            )}
          >
            <span className="font-medium">{section.title}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform group-open:rotate-180" />
          </summary>
          <div
            className={cn(
              "space-y-4 border-t px-6 pb-6 pt-4",
              isDark
                ? "border-[rgba(196,163,90,0.08)] text-[rgba(248,246,242,0.72)]"
                : "border-[rgba(12,45,74,0.06)] sn-prose"
            )}
          >
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="text-[0.9375rem] leading-relaxed">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="ml-4 list-disc space-y-2 text-[0.9375rem] leading-relaxed opacity-90">
                {section.list.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
