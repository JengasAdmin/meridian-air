import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serverLang } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const { lang, dict } = await serverLang();
  const news = await db.news.findUnique({ where: { slug: params.slug }, include: { author: true } });
  if (!news || news.status !== "PUBLISHED") notFound();

  return (
    <article className="container-page max-w-3xl py-16">
      <Link href="/news" className="link-muted text-sm">← {dict["news.back"]}</Link>
      <div className="mt-6 text-xs uppercase tracking-widest text-electric">{news.category}</div>
      <h1 className="heading-lg mt-2">{lang === "ru" ? news.titleRu : news.titleEn}</h1>
      <div className="mt-4 text-sm text-steel">
        {new Date(news.publishedAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")} · {news.author.name}
      </div>
      <div className="mt-10 whitespace-pre-wrap leading-relaxed text-mist/90">
        {lang === "ru" ? news.contentRu : news.contentEn}
      </div>
    </article>
  );
}
