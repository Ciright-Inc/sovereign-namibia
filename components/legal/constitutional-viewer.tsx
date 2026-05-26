"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, Search } from "lucide-react";
import {
  CONSTITUTION_CHAPTERS,
  CONSTITUTION_PREAMBLE,
  CONSTITUTION_ARTICLE_COUNT,
  searchConstitution,
} from "@/lib/constitution";
import { cn } from "@/lib/utils";

export function ConstitutionalViewer() {
  const [query, setQuery] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<string | null>("ch3");

  const searchResults = useMemo(() => searchConstitution(query), [query]);

  return (
    <section
      className="sn-legal-section rounded-2xl border border-[rgba(196,163,90,0.12)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md"
      aria-labelledby="constitution-heading"
    >
      <div className="border-b border-[rgba(196,163,90,0.1)] px-6 py-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[rgba(196,163,90,0.1)] p-3">
            <BookOpen className="h-6 w-6 text-[var(--sn-gold)]" aria-hidden />
          </div>
          <div>
            <h2 id="constitution-heading" className="text-xl font-semibold text-[var(--sn-gold)]">
              Constitution of the Republic of Namibia
            </h2>
            <p className="mt-1 text-sm text-[rgba(248,246,242,0.55)]">
              Adopted 21 March 1990 · {CONSTITUTION_ARTICLE_COUNT} articles indexed · Supreme law
              of the Republic
            </p>
          </div>
        </div>

        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(248,246,242,0.35)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles — e.g. privacy, dignity, equality, administration..."
            className="w-full rounded-xl border border-[rgba(196,163,90,0.15)] bg-[rgba(0,0,0,0.25)] py-3 pl-11 pr-4 text-sm text-[rgba(248,246,242,0.9)] placeholder:text-[rgba(248,246,242,0.35)] focus:border-[rgba(196,163,90,0.35)] focus:outline-none focus:ring-2 focus:ring-[rgba(196,163,90,0.12)]"
            aria-label="Search Constitution of Namibia"
          />
        </div>
      </div>

      {query.trim() ? (
        <div className="px-6 py-6">
          {searchResults.length === 0 ? (
            <p className="text-sm text-[rgba(248,246,242,0.5)]">
              No articles match your search. Try terms such as &ldquo;privacy&rdquo;,
              &ldquo;dignity&rdquo;, or &ldquo;administration&rdquo;.
            </p>
          ) : (
            <ul className="space-y-4">
              {searchResults.map(({ chapter, article }) => (
                <li
                  key={`${chapter.id}-${article.number}`}
                  className="rounded-xl border border-[rgba(196,163,90,0.08)] bg-[rgba(255,255,255,0.02)] p-5"
                >
                  <p className="text-xs uppercase tracking-wider text-[rgba(196,163,90,0.6)]">
                    {chapter.number} · Article {article.number}
                  </p>
                  <h3 className="mt-1 font-medium text-[var(--sn-gold)]">{article.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[rgba(248,246,242,0.7)]">
                    {article.text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="px-6 py-6">
          <details className="group mb-6 overflow-hidden rounded-xl border border-[rgba(196,163,90,0.08)] bg-[rgba(255,255,255,0.02)]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[var(--sn-gold)] [&::-webkit-details-marker]:hidden">
              <span className="font-medium">Preamble</span>
              <ChevronDown className="h-4 w-4 opacity-50 transition-transform group-open:rotate-180" />
            </summary>
            <p className="border-t border-[rgba(196,163,90,0.08)] px-5 py-4 text-sm leading-relaxed text-[rgba(248,246,242,0.7)]">
              {CONSTITUTION_PREAMBLE}
            </p>
          </details>

          <div className="space-y-2">
            {CONSTITUTION_CHAPTERS.map((chapter) => (
              <div
                key={chapter.id}
                className="overflow-hidden rounded-xl border border-[rgba(196,163,90,0.08)] bg-[rgba(255,255,255,0.02)]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)
                  }
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[rgba(255,255,255,0.02)]"
                  aria-expanded={expandedChapter === chapter.id}
                >
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[rgba(196,163,90,0.6)]">
                      {chapter.number}
                    </p>
                    <p className="font-medium text-[rgba(248,246,242,0.9)]">{chapter.title}</p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-[rgba(248,246,242,0.4)] transition-transform",
                      expandedChapter === chapter.id && "rotate-180"
                    )}
                  />
                </button>

                {expandedChapter === chapter.id && (
                  <div className="border-t border-[rgba(196,163,90,0.08)] px-5 py-4">
                    <div className="space-y-4">
                      {chapter.articles.map((article) => (
                        <article
                          key={article.number}
                          id={`article-${article.number}`}
                          className="scroll-mt-24"
                        >
                          <h4 className="text-sm font-medium text-[var(--sn-gold)]">
                            Article {article.number}: {article.title}
                          </h4>
                          <p className="mt-2 text-sm leading-relaxed text-[rgba(248,246,242,0.68)]">
                            {article.text}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
