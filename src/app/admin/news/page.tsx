"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { Skeleton } from "@/components/ui";

type NewsItem = { id: string; slug: string; titleRu: string; titleEn: string; category: string; publishedAt: string };

export default function AdminNewsPage() {
  const { t } = useLang();
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [form, setForm] = useState({
    slug: "", titleRu: "", titleEn: "", shortRu: "", shortEn: "",
    contentRu: "", contentEn: "", category: "GENERAL",
  });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setItems((await (await fetch("/api/news")).json()).news);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/news/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ slug: "", titleRu: "", titleEn: "", shortRu: "", shortEn: "", contentRu: "", contentEn: "", category: "GENERAL" });
      load();
    } else {
      const d = await res.json();
      setMsg(d.error ?? t("error.generic"));
    }
  }

  return (
    <div>
      <form onSubmit={create} className="surface mb-8 grid gap-3 p-6 sm:grid-cols-2">
        <input required className="input" placeholder="slug (my-article)" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} aria-label="Slug" />
        <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value.toUpperCase() }))} aria-label="Category" />
        <input required className="input" placeholder="Заголовок RU" value={form.titleRu} onChange={(e) => setForm((f) => ({ ...f, titleRu: e.target.value }))} aria-label="Title RU" />
        <input required className="input" placeholder="Title EN" value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} aria-label="Title EN" />
        <input required className="input" placeholder="Краткое описание RU" value={form.shortRu} onChange={(e) => setForm((f) => ({ ...f, shortRu: e.target.value }))} aria-label="Short RU" />
        <input required className="input" placeholder="Short description EN" value={form.shortEn} onChange={(e) => setForm((f) => ({ ...f, shortEn: e.target.value }))} aria-label="Short EN" />
        <textarea required className="input min-h-24" placeholder="Текст новости RU" value={form.contentRu} onChange={(e) => setForm((f) => ({ ...f, contentRu: e.target.value }))} aria-label="Content RU" />
        <textarea required className="input min-h-24" placeholder="Content EN" value={form.contentEn} onChange={(e) => setForm((f) => ({ ...f, contentEn: e.target.value }))} aria-label="Content EN" />
        <div className="sm:col-span-2">
          <button className="btn-primary">{t("admin.create")}</button>
          {msg && <span className="ml-3 text-sm text-red-400">{msg}</span>}
        </div>
      </form>

      {items === null ? <Skeleton className="h-64" /> : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="surface flex items-center justify-between p-4 text-sm">
              <div>
                <span className="font-mono text-electric">{n.slug}</span>
                <span className="ml-3">{n.titleRu} / {n.titleEn}</span>
              </div>
              <button
                className="btn-danger btn-sm"
                onClick={async () => {
                  await fetch(`/api/news/manage?slug=${n.slug}`, { method: "DELETE" });
                  load();
                }}
              >
                {t("admin.delete")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
