import Link from "next/link";
import { getPublishedArticles } from "@/lib/cms-service";

export default async function NewsSubdomainPage() {
  const articles = await getPublishedArticles(20);

  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)]">
      <header className="border-b border-[rgba(12,45,74,0.08)] px-6 py-8">
        <p className="sn-eyebrow">news.sovereignnamibia.com</p>
        <h1 className="mt-2 sn-display text-3xl md:text-4xl">News &amp; National Notices</h1>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-6">
          {articles.map((article) => (
            <article key={article.id} className="sn-card p-8">
              {article.emergencyAlert && (
                <span className="mb-3 inline-block rounded-full bg-red-100 px-3 py-1 text-xs text-red-800">
                  Emergency Alert
                </span>
              )}
              <span className="sn-status-badge">{article.category ?? "News"}</span>
              <h2 className="mt-4 text-xl font-semibold text-[var(--sn-blue)]">{article.title}</h2>
              {article.excerpt && <p className="mt-3 sn-prose">{article.excerpt}</p>}
              {article.iframeUrl ? (
                <iframe
                  title={article.title}
                  src={article.iframeUrl}
                  className="mt-6 h-96 w-full rounded-lg border border-[rgba(12,45,74,0.1)]"
                />
              ) : (
                <p className="mt-4 sn-prose text-sm">
                  {(article.content as { body?: string }).body}
                </p>
              )}
              <Link
                href={`/news/${article.slug}`}
                className="mt-4 inline-block text-sm text-[var(--sn-blue)] underline"
              >
                Read more
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
