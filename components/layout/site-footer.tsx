"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Shield } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { LEGAL_SUMMARIES } from "@/lib/legal-content";
import type { LegalSlug } from "@/lib/legal-slugs";
import {
  FOOTER_LEGAL_LINKS,
  FOOTER_PLATFORM_LINKS,
  FOOTER_STATUS_LINK,
} from "@/components/layout/footer-link-groups";

export function SiteFooter() {
  const [previewSlug, setPreviewSlug] = useState<LegalSlug | null>(null);
  const preview = previewSlug ? LEGAL_SUMMARIES[previewSlug] : null;
  const previewHref = previewSlug ? `/legal/${previewSlug}` : "/";

  return (
    <>
      <footer className="sn-site-footer relative mt-auto overflow-hidden">
        <div className="sn-footer-glow pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <p className="sn-footer-eyebrow">Republic of Namibia</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--sn-gold)]">
                Sovereign Namibia
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[rgba(248,246,242,0.55)]">
                Constitutionally aligned digital governance infrastructure. Your data belongs to
                you. National trust, enterprise security, citizen-first design.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-[rgba(196,163,90,0.7)]">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                <span>Sovereign · Secure · Citizen-owned data</span>
              </div>
            </div>

            <nav aria-label="Legal and governance">
              <h3 className="sn-footer-eyebrow">Legal &amp; Governance</h3>
              <ul className="mt-4 space-y-3">
                {FOOTER_LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        if (!link.slug || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        setPreviewSlug(link.slug);
                      }}
                      className="group flex w-full flex-col items-start text-left transition"
                    >
                      <span className="text-sm text-[rgba(248,246,242,0.85)] transition group-hover:text-[var(--sn-gold)]">
                        {link.label}
                      </span>
                      {link.description && (
                        <span className="mt-0.5 text-xs text-[rgba(248,246,242,0.35)]">
                          {link.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Platform">
              <h3 className="sn-footer-eyebrow">Platform</h3>
              <ul className="mt-4 space-y-3">
                {FOOTER_PLATFORM_LINKS.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-[rgba(248,246,242,0.75)] transition hover:text-[var(--sn-gold)]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-[rgba(248,246,242,0.75)] transition hover:text-[var(--sn-gold)]"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
                <li>
                  {FOOTER_STATUS_LINK.external ? (
                    <a
                      href={FOOTER_STATUS_LINK.href}
                      className="inline-flex items-center gap-1.5 text-sm text-[rgba(248,246,242,0.75)] transition hover:text-[var(--sn-gold)]"
                    >
                      {FOOTER_STATUS_LINK.label}
                      <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
                    </a>
                  ) : (
                    <Link
                      href={FOOTER_STATUS_LINK.href}
                      className="inline-flex items-center gap-1.5 text-sm text-[rgba(248,246,242,0.75)] transition hover:text-[var(--sn-gold)]"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      </span>
                      {FOOTER_STATUS_LINK.label}
                    </Link>
                  )}
                </li>
              </ul>
            </nav>

            <div>
              <h3 className="sn-footer-eyebrow">Infrastructure Transparency</h3>
              <p className="mt-4 text-sm leading-relaxed text-[rgba(248,246,242,0.5)]">
                Regional infrastructure hosted in Southern Africa with encrypted multi-region
                continuity. All transfers encrypted in transit and at rest.
              </p>
              <Link
                href="/status"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--sn-gold)] transition hover:opacity-80"
              >
                View live status
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative border-t border-[rgba(196,163,90,0.08)] px-6 py-5">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
            <p className="text-xs text-[rgba(248,246,242,0.35)]">
              © {new Date().getFullYear()} Sovereign Namibia. All rights reserved. Governed by the
              Constitution of the Republic of Namibia.
            </p>
            <p className="text-xs text-[rgba(248,246,242,0.25)]">
              Enterprise-grade sovereign digital infrastructure
            </p>
          </div>
        </div>
      </footer>

      {preview && previewSlug && (
        <Modal
          open={Boolean(previewSlug)}
          onClose={() => setPreviewSlug(null)}
          title={preview.title}
          description={preview.summary}
          size="md"
        >
          <ul className="space-y-3">
            {preview.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-[rgba(248,246,242,0.72)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sn-gold)]" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <Link
              href={previewHref}
              className="sn-btn sn-btn-primary flex-1 text-center text-sm"
              onClick={() => setPreviewSlug(null)}
            >
              Read full document
            </Link>
            <button
              type="button"
              onClick={() => setPreviewSlug(null)}
              className="sn-btn sn-btn-outline border-[rgba(196,163,90,0.25)] text-[rgba(248,246,242,0.7)]"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
