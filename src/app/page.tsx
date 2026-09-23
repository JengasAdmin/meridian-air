import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { serverLang } from "@/i18n/server";
import { SectionTitle, StatCard, Card, StatusBadge, duration } from "@/components/ui";
import { LiveOpsTeaser } from "@/components/LiveOpsTeaser";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { lang, dict } = await serverLang();
  const [hubs, fleetSample, cats, news, stats] = await Promise.all([
    db.airport.findMany({ where: { isHub: true }, orderBy: { code: "asc" } }),
    db.aircraft.findMany({ include: { category: true, hub: true }, take: 6, orderBy: { registration: "asc" } }),
    db.aircraftCategory.findMany(),
    db.news.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 3 }),
    Promise.all([
      db.pilotProfile.count(),
      db.pilotProfile.aggregate({ _sum: { hours: true, flightsCount: true } }),
      db.aircraft.count(),
      db.route.count(),
    ]),
  ]);
  const [pilots, hoursAgg, aircraftCount, routeCount] = stats;

  const opCards = cats.map((c) => ({
    key: c.key,
    title: lang === "ru" ? c.nameRu : c.nameEn,
    desc: dict[`op.${c.key}.desc` as keyof typeof dict] ?? "",
    count: fleetSample.filter((f) => f.category.key === c.key).length,
  }));

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/tailfin-hero.png" alt="" fill priority className="object-cover object-right opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-transparent" />
        </div>
        <div className="container-page relative flex min-h-[80vh] flex-col justify-center py-24">
          <div className="badge mb-6 w-fit bg-electric/15 text-electric">{dict["home.heroBadge"]}</div>
          <h1 className="heading-xl animate-slide-up">{dict["home.heroTitle"]}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-steel animate-slide-up">
            {dict["home.heroSub"]}
          </p>
          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in">
            <Link href="/book" className="btn-primary px-7 py-3 text-base">{dict["home.bookNow"]}</Link>
            <Link href="/fleet" className="btn-ghost px-7 py-3 text-base">{dict["home.exploreFleet"]}</Link>
            <Link href="/register" className="btn-ghost px-7 py-3 text-base">{dict["home.joinMeridian"]}</Link>
          </div>
        </div>
      </section>

      {/* ── Live operations ── */}
      <section className="section container-page">
        <SectionTitle title={dict["home.liveOps"]} sub={dict["home.liveOpsSub"]} />
        <LiveOpsTeaser />
      </section>

      {/* ── Statistics ── */}
      <section className="container-page pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard accent value={pilots} label={dict["home.pilots"]} />
          <StatCard accent value={hoursAgg._sum.flightsCount ?? 0} label={dict["home.flights"]} />
          <StatCard accent value={Math.round(hoursAgg._sum.hours ?? 0)} label={dict["home.hours"]} />
          <StatCard accent value={aircraftCount} label={dict["home.aircraft"]} />
        </div>
      </section>

      {/* ── Network / hubs ── */}
      <section className="section container-page">
        <SectionTitle title={dict["home.network"]} sub={dict["home.networkSub"]} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {hubs.map((h) => (
            <Link key={h.code} href={`/hubs/${h.code}`} className="surface group p-6 transition-all hover:border-electric hover:shadow-glow">
              <div className="font-mono text-2xl font-bold text-mist group-hover:text-electric">{h.code}</div>
              <div className="mt-1 text-sm text-steel">{lang === "ru" ? h.cityRu ?? h.city : h.city}</div>
              <div className="mt-3 text-xs text-steel/70">{h.countryRu && lang === "ru" ? h.countryRu : h.country}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Fleet ── */}
      <section className="section container-page">
        <SectionTitle title={dict["home.fleet"]} sub={dict["home.fleetSub"]} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fleetSample.slice(0, 6).map((a) => (
            <Card key={a.id} className="hover:border-electric/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-sm text-electric">{a.registration}</div>
                  <div className="mt-1 font-semibold text-mist">{a.name}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-steel">
                <span>{dict["fleet.hub"]}: {a.hub?.code ?? "—"}</span>
                {a.capacityPax && <span>{a.capacityPax} {dict["fleet.pax"]}</span>}
                {a.capacityCargoKg && <span>{a.capacityCargoKg.toLocaleString()} kg</span>}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/fleet" className="btn-ghost btn-sm">{dict["home.exploreFleet"]} →</Link>
        </div>
      </section>

      {/* ── Operations domains ── */}
      <section className="section container-page">
        <SectionTitle title={dict["home.operations"]} sub={dict["home.operationsSub"]} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {opCards.map((c) => (
            <Link key={c.key} href={`/fleet?cat=${c.key}`} className="surface group flex flex-col p-6 transition-all hover:border-electric">
              <div className="font-mono text-xs uppercase tracking-widest text-electric">{c.key}</div>
              <div className="mt-2 font-semibold text-mist">{c.title}</div>
              <div className="mt-2 flex-1 text-sm text-steel">{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── News ── */}
      <section className="section container-page">
        <SectionTitle title={dict["home.news"]} sub={dict["home.newsSub"]} />
        <div className="grid gap-4 lg:grid-cols-3">
          {news.map((n) => (
            <Link key={n.id} href={`/news/${n.slug}`} className="surface group p-6 transition-all hover:border-electric">
              <div className="text-xs uppercase tracking-widest text-electric">{n.category}</div>
              <div className="mt-2 font-semibold leading-snug text-mist group-hover:text-electric">
                {lang === "ru" ? n.titleRu : n.titleEn}
              </div>
              <p className="mt-3 text-sm text-steel">{lang === "ru" ? n.shortRu : n.shortEn}</p>
              <div className="mt-4 text-xs text-steel/60">
                {new Date(n.publishedAt).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container-page pb-24">
        <div className="surface relative overflow-hidden p-10 text-center sm:p-16">
          <div className="absolute inset-0 bg-gradient-to-b from-royal/30 to-transparent" aria-hidden />
          <div className="relative">
            <h2 className="heading-lg">{dict["home.ctaTitle"]}</h2>
            <p className="mx-auto mt-4 max-w-xl text-steel">{dict["home.ctaSub"]}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/register" className="btn-primary px-7 py-3 text-base">{dict["home.joinMeridian"]}</Link>
              <Link href="/routes" className="btn-ghost px-7 py-3 text-base">{dict["home.viewRoutes"]}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
