import { DEMO_PAGES, DEMO_ARTICLES } from "@/lib/cms-service";

export default function AdminCmsPage() {
  return (
    <div className="min-h-screen bg-[#0c1a2e] px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold">CMS Manager</h1>
      <p className="mt-2 text-sm text-white/50">
        Manage homepage content, legal pages, news, alerts, and KYC instructions.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Pages</h2>
        <div className="mt-4 space-y-2">
          {DEMO_PAGES.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <span>{page.title}</span>
              <span className="text-xs text-white/50">{page.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Articles</h2>
        <div className="mt-4 space-y-2">
          {DEMO_ARTICLES.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <span>{article.title}</span>
              <span className="text-xs text-white/50">{article.category}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
