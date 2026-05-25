import Link from "next/link";
import { FadeIn, PageHero } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { getPublishedPage, getPublishedArticles, getEmergencyAlerts } from "@/lib/cms-service";

export default async function HomePage() {
  const [home, articles, alerts] = await Promise.all([
    getPublishedPage("home"),
    getPublishedArticles(3),
    getEmergencyAlerts(),
  ]);

  const hero = home?.content as {
    hero?: string;
    subtitle?: string;
    notices?: { title: string; body: string; emergency?: boolean }[];
  };

  return (
    <>
      {alerts.map((alert) => (
        <div key={alert.id} className="sn-alert-emergency px-6 py-3 text-center text-sm">
          <strong>{alert.title}</strong>
        </div>
      ))}

      <PageHero
        eyebrow="National Digital Identity"
        title={hero?.hero ?? "Your trusted national digital identity."}
        subtitle={
          hero?.subtitle ??
          "Find your citizen identity record. Claim and secure your account. Access government services with confidence."
        }
      >
        <Link href="/find-account">
          <Button size="lg">Find My Citizen Account</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" size="lg">
            Register as Citizen
          </Button>
        </Link>
      </PageHero>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {[
            {
              title: "Find your record",
              body: "Search the national citizen directory with privacy-safe, masked results.",
            },
            {
              title: "Claim and secure",
              body: "Verify your mobile number, complete identity verification, and activate your account.",
            },
            {
              title: "Access services",
              body: "Only verified citizens may access government digital services.",
            },
          ].map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.08}>
              <div className="sn-card h-full p-8">
                <h2 className="text-lg font-semibold text-[var(--sn-blue)]">{item.title}</h2>
                <p className="mt-3 sn-prose text-sm">{item.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {(hero?.notices?.length ?? 0) > 0 && (
        <section className="border-y border-[rgba(12,45,74,0.08)] bg-white/30 px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <p className="sn-eyebrow mb-6">National Notices</p>
            {hero?.notices?.map((notice) => (
              <div key={notice.title} className="sn-card mb-4 p-6">
                <h3 className="font-medium text-[var(--sn-blue)]">{notice.title}</h3>
                <p className="mt-2 sn-prose text-sm">{notice.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="sn-eyebrow mb-6">Latest News</p>
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`https://news.sovereignnamibia.com/${article.slug}`}
                className="sn-card block p-6 transition hover:shadow-md"
              >
                <span className="sn-status-badge">{article.category ?? "News"}</span>
                <h3 className="mt-3 text-lg font-medium text-[var(--sn-blue)]">{article.title}</h3>
                {article.excerpt && <p className="mt-2 sn-prose text-sm">{article.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <FadeIn>
          <p className="sn-eyebrow">Protected Online</p>
          <h2 className="mt-4 sn-display text-3xl md:text-5xl">Be Protected Online.</h2>
          <p className="mx-auto mt-6 max-w-xl sn-prose">
            Your documents are encrypted during upload. Your identity is verified with care.
          </p>
        </FadeIn>
      </section>
    </>
  );
}
