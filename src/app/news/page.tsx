import Link from "next/link";
import { db } from "@/lib/db";
import { serverLang } from "@/i18n/server";
import { SectionTitle } from "@/components/ui";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const { lang, dict } = await serverLang();
  const news = await db.news.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } });
  return (
    <div className="container-page section">
      <SectionTitle title={dict["news.title"]} sub={dict["news.sub"]} />
      {news.length === 0 ? (
        <EmptyState titleKey="news.empty" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {news.map((n) => (
            <Link key={n.id} href={`/news/${n.slug}`} className="surface group flex flex-col p-7 transition-all hover:border-electric">
              <div className="text-xs uppercase tracking-widest text-electric">{n.category}</div>
              <div className="mt-2 text-lg font-semibold leading-snug group-hover:text-electric">
                {lang === "ru" ? n.titleRu : n.titleEn}
              </div>
              <p className="mt-3 flex-1 text-sm text-steel">{lang === "ru" ? n.shortRu : n.shortEn}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-steel/60">
                <span>{new Date(n.publishedAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}</span>
                <span className="text-electric">{dict["news.readMore"]} →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
