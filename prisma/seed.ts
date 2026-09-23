/* Meridian AIR — database seed.
 * Creates: airports/hubs, aircraft categories, fleet, RBAC roles+permissions,
 * flight number ranges, qualifications, training courses, news, demo pilots,
 * demo bookings/PIREPs, and the setup admin account (from SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD env vars — never hardcoded into the repo).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function distanceNm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3440.065;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

const AIRPORTS = [
  { code: "UMKK", iata: "KGD", name: "Khrabrovo Airport", city: "Kaliningrad", cityRu: "Калининград", country: "Russia", countryRu: "Россия", lat: 54.889, lon: 20.593, isHub: true, tz: "Europe/Kaliningrad" },
  { code: "UUEE", iata: "SVO", name: "Sheremetyevo International", city: "Moscow", cityRu: "Москва", country: "Russia", countryRu: "Россия", lat: 55.973, lon: 37.413, isHub: true, tz: "Europe/Moscow" },
  { code: "OMDB", iata: "DXB", name: "Dubai International", city: "Dubai", cityRu: "Дубай", country: "UAE", countryRu: "ОАЭ", lat: 25.253, lon: 55.365, isHub: true, tz: "Asia/Dubai" },
  { code: "LTFM", iata: "IST", name: "Istanbul Airport", city: "Istanbul", cityRu: "Стамбул", country: "Turkey", countryRu: "Турция", lat: 41.275, lon: 28.752, isHub: true, tz: "Europe/Istanbul" },
  { code: "UHHH", iata: "KHV", name: "Novy Airport", city: "Khabarovsk", cityRu: "Хабаровск", country: "Russia", countryRu: "Россия", lat: 48.528, lon: 135.188, isHub: true, tz: "Asia/Vladivostok" },
  { code: "URSS", iata: "AER", name: "Sochi International", city: "Sochi", cityRu: "Сочи", country: "Russia", countryRu: "Россия", lat: 43.45, lon: 39.956 },
  { code: "ULLI", iata: "LED", name: "Pulkovo Airport", city: "Saint Petersburg", cityRu: "Санкт-Петербург", country: "Russia", countryRu: "Россия", lat: 59.8, lon: 30.263 },
  { code: "UWWW", iata: "KUF", name: "Kurumoch International", city: "Samara", cityRu: "Самара", country: "Russia", countryRu: "Россия", lat: 53.505, lon: 50.164 },
  { code: "UNKL", iata: "KJA", name: "Yemelyanovo Airport", city: "Krasnoyarsk", cityRu: "Красноярск", country: "Russia", countryRu: "Россия", lat: 56.173, lon: 92.493 },
  { code: "UUBW", iata: "VKO", name: "Vnukovo International", city: "Moscow", cityRu: "Москва", country: "Russia", countryRu: "Россия", lat: 55.592, lon: 37.269 },
  { code: "EFHK", iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", cityRu: "Хельсинки", country: "Finland", countryRu: "Финляндия", lat: 60.318, lon: 24.963 },
  { code: "EDDF", iata: "FRA", name: "Frankfurt Main", city: "Frankfurt", cityRu: "Франкфурт", country: "Germany", countryRu: "Германия", lat: 50.033, lon: 8.571 },
  { code: "UKBB", iata: "KBP", name: "Boryspil International", city: "Kyiv", cityRu: "Киев", country: "Ukraine", countryRu: "Украина", lat: 50.345, lon: 30.894 },
  { code: "ZBTJ", iata: "TSN", name: "Tianjin Binhai", city: "Tianjin", cityRu: "Тяньцзинь", country: "China", countryRu: "Китай", lat: 39.124, lon: 117.346 },
  { code: "UHWW", iata: "VVO", name: "Vladivostok International", city: "Vladivostok", cityRu: "Владивосток", country: "Russia", countryRu: "Россия", lat: 43.399, lon: 132.148 },
  { code: "USTR", iata: "TOF", name: "Bogashevo Airport", city: "Tomsk", cityRu: "Томск", country: "Russia", countryRu: "Россия", lat: 56.387, lon: 85.212 },
  { code: "OBBI", iata: "BAH", name: "Bahrain International", city: "Manama", cityRu: "Манама", country: "Bahrain", countryRu: "Бахрейн", lat: 26.271, lon: 50.634 },
  { code: "LTBA", iata: "SAW", name: "Sabiha Gökçen", city: "Istanbul", cityRu: "Стамбул", country: "Turkey", countryRu: "Турция", lat: 40.899, lon: 29.31 },
  { code: "UUDD", iata: "DME", name: "Domodedovo", city: "Moscow", cityRu: "Москва", country: "Russia", countryRu: "Россия", lat: 55.409, lon: 37.906 },
  { code: "USCC", iata: "SVX", name: "Koltsovo Airport", city: "Yekaterinburg", cityRu: "Екатеринбург", country: "Russia", countryRu: "Россия", lat: 56.743, lon: 60.803 },
];

const CATEGORIES = [
  { key: "PASSENGER", nameRu: "Пассажирская авиация", nameEn: "Passenger Aviation" },
  { key: "CARGO", nameRu: "Грузовая авиация", nameEn: "Cargo Aviation" },
  { key: "MILITARY", nameRu: "Военная авиация", nameEn: "Military Aviation" },
  { key: "GENERAL", nameRu: "Авиация общего назначения", nameEn: "General Aviation" },
  { key: "SOVIET", nameRu: "Советская авиация", nameEn: "Soviet Aviation" },
];

const FLEET: { reg: string; type: string; name: string; mfr: string; cat: string; pax?: number; cargo?: number; mil?: boolean }[] = [
  // Passenger Airbus
  { reg: "MRD-A320-101", type: "A320", name: "Airbus A320-200", mfr: "Airbus", cat: "PASSENGER", pax: 180 },
  { reg: "MRD-A320-102", type: "A320", name: "Airbus A320neo", mfr: "Airbus", cat: "PASSENGER", pax: 186 },
  { reg: "MRD-A330-201", type: "A330", name: "Airbus A330-300", mfr: "Airbus", cat: "PASSENGER", pax: 277 },
  { reg: "MRD-A340-301", type: "A340", name: "Airbus A340-300", mfr: "Airbus", cat: "PASSENGER", pax: 295 },
  { reg: "MRD-A350-901", type: "A350", name: "Airbus A350-900", mfr: "Airbus", cat: "PASSENGER", pax: 325 },
  { reg: "MRD-A380-841", type: "A380", name: "Airbus A380-800", mfr: "Airbus", cat: "PASSENGER", pax: 545 },
  // Passenger Boeing
  { reg: "MRD-B737-8L1", type: "B737", name: "Boeing 737-800", mfr: "Boeing", cat: "PASSENGER", pax: 189 },
  { reg: "MRD-B747-446", type: "B747", name: "Boeing 747-400", mfr: "Boeing", cat: "PASSENGER", pax: 416 },
  { reg: "MRD-B757-256", type: "B757", name: "Boeing 757-200", mfr: "Boeing", cat: "PASSENGER", pax: 200 },
  { reg: "MRD-B767-3Q8", type: "B767", name: "Boeing 767-300", mfr: "Boeing", cat: "PASSENGER", pax: 261 },
  { reg: "MRD-B777-3M0", type: "B777", name: "Boeing 777-300ER", mfr: "Boeing", cat: "PASSENGER", pax: 396 },
  // Cargo
  { reg: "MRD-B748F-01", type: "B747", name: "Boeing 747-8F", mfr: "Boeing", cat: "CARGO", cargo: 137000 },
  { reg: "MRD-A332F-01", type: "A330", name: "Airbus A330-200F", mfr: "Airbus", cat: "CARGO", cargo: 65000 },
  { reg: "MRD-B763F-01", type: "B767", name: "Boeing 767-300F", mfr: "Boeing", cat: "CARGO", cargo: 52700 },
  // Military
  { reg: "MRD-SU30-01", type: "Su-30", name: "Sukhoi Su-30SM", mfr: "Sukhoi", cat: "MILITARY", mil: true },
  { reg: "MRD-MIG29-01", type: "MiG-29", name: "Mikoyan MiG-29", mfr: "Mikoyan", cat: "MILITARY", mil: true },
  { reg: "MRD-IL76MD-01", type: "Il-76", name: "Ilyushin Il-76MD", mfr: "Ilyushin", cat: "MILITARY", mil: true, cargo: 48000 },
  // General Aviation
  { reg: "MRD-C172-01", type: "C172", name: "Cessna 172 Skyhawk", mfr: "Cessna", cat: "GENERAL", pax: 3 },
  { reg: "MRD-DA40-01", type: "DA40", name: "Diamond DA40 NG", mfr: "Diamond", cat: "GENERAL", pax: 3 },
  // Soviet Aviation
  { reg: "MRD-TU154-01", type: "Tu-154", name: "Tupolev Tu-154M", mfr: "Tupolev", cat: "SOVIET", pax: 158 },
  { reg: "MRD-AN24-01", type: "An-24", name: "Antonov An-24RV", mfr: "Antonov", cat: "SOVIET", pax: 44 },
  { reg: "MRD-YAK40-01", type: "Yak-40", name: "Yakovlev Yak-40", mfr: "Yakovlev", cat: "SOVIET", pax: 32 },
  { reg: "MRD-IL62-01", type: "Il-62", name: "Ilyushin Il-62M", mfr: "Ilyushin", cat: "SOVIET", pax: 186 },
];

const HUB_ASSIGN = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 0, 1, 2, 3, 4, 1, 2, 3, 0, 4];

const ROUTE_PAIRS: [number, number, string][] = [
  [0, 1, "PASSENGER"], [1, 0, "PASSENGER"], [0, 2, "PASSENGER"], [2, 0, "PASSENGER"],
  [0, 3, "PASSENGER"], [3, 0, "PASSENGER"], [1, 3, "PASSENGER"], [3, 1, "PASSENGER"],
  [1, 2, "PASSENGER"], [2, 1, "PASSENGER"], [1, 4, "PASSENGER"], [4, 1, "PASSENGER"],
  [0, 6, "PASSENGER"], [6, 0, "PASSENGER"], [1, 7, "PASSENGER"], [1, 8, "PASSENGER"],
  [2, 16, "PASSENGER"], [3, 12, "PASSENGER"], [1, 10, "PASSENGER"], [1, 11, "PASSENGER"],
  [4, 14, "PASSENGER"], [8, 4, "PASSENGER"], [0, 5, "PASSENGER"], [5, 0, "PASSENGER"],
  [1, 18, "PASSENGER"], [2, 17, "PASSENGER"], [1, 19, "PASSENGER"], [4, 15, "PASSENGER"],
  [1, 9, "PASSENGER"], [2, 13, "PASSENGER"],
  [1, 2, "CARGO"], [2, 1, "CARGO"], [1, 4, "CARGO"], [0, 1, "CARGO"], [2, 13, "CARGO"], [1, 11, "CARGO"],
  [0, 5, "MILITARY"], [1, 4, "MILITARY"], [1, 0, "MILITARY"], [0, 3, "MILITARY"],
  [0, 6, "GENERAL"], [1, 9, "GENERAL"], [0, 5, "GENERAL"],
  [0, 1, "SOVIET"], [1, 7, "SOVIET"], [1, 5, "SOVIET"], [0, 3, "SOVIET"],
];

const NUMBER_SEQ: Record<string, number> = {};

function flightNumberFor(cat: string): string {
  const ranges: Record<string, [number, number]> = {
    PASSENGER: [100, 499], CARGO: [500, 699], MILITARY: [700, 799],
    GENERAL: [800, 849], SOVIET: [850, 899],
  };
  const [base] = ranges[cat];
  NUMBER_SEQ[cat] = (NUMBER_SEQ[cat] ?? base - 1) + 1;
  return `MRD${NUMBER_SEQ[cat]}`;
}

function durationFor(nm: number, cruiseKt = 450) {
  return Math.round((nm / cruiseKt) * 60 + 30); // +30 min taxi/climb allowance
}


async function upsertUserRole(userId: string, roleId: string, hubId?: string | null) {
  const existing = await db.userRole.findFirst({ where: { userId, roleId, hubId: hubId ?? null } });
  if (existing) return existing;
  return db.userRole.create({ data: { userId, roleId, hubId: hubId ?? undefined } });
}

async function main() {
  console.log("Seeding Meridian AIR…");

  // ── Permissions + roles ─────────────────────────────────────────
  const { ALL_PERMISSIONS, ROLE_DEFINITIONS, expandGroups, HUB_CODES } = await import("../src/lib/rbac");
  for (const key of ALL_PERMISSIONS) {
    await db.permission.upsert({ where: { key }, create: { key }, update: {} });
  }
  const roleIds: Record<string, string> = {};
  for (const rd of ROLE_DEFINITIONS) {
    const role = await db.role.upsert({
      where: { key: rd.key },
      create: { key: rd.key, nameRu: rd.nameRu, nameEn: rd.nameEn, department: rd.department, rank: rd.rank, isPilotRank: rd.isPilotRank ?? false },
      update: { nameRu: rd.nameRu, nameEn: rd.nameEn, department: rd.department, rank: rd.rank },
    });
    roleIds[rd.key] = role.id;
  }
  for (const rd of ROLE_DEFINITIONS) {
    if (rd.inherits) {
      await db.role.update({ where: { key: rd.key }, data: { inheritsId: roleIds[rd.inherits] } });
    }
    const perms = expandGroups(rd.groups ?? []);
    await db.rolePermission.deleteMany({ where: { roleId: roleIds[rd.key] } });
    for (const key of perms) {
      const p = await db.permission.findUnique({ where: { key } });
      if (p) await db.rolePermission.create({ data: { roleId: roleIds[rd.key], permissionId: p.id } });
    }
  }

  // ── Airports ────────────────────────────────────────────────────
  const airports: Record<string, string> = {};
  for (const a of AIRPORTS) {
    const row = await db.airport.upsert({ where: { code: a.code }, create: a, update: a });
    airports[a.code] = row.id;
  }

  // ── Aircraft categories + fleet ─────────────────────────────────
  const catIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const row = await db.aircraftCategory.upsert({ where: { key: c.key }, create: c, update: c });
    catIds[c.key] = row.id;
  }
  const hubCodes = HUB_CODES;
  for (let i = 0; i < FLEET.length; i++) {
    const f = FLEET[i];
    const hubCode = hubCodes[HUB_ASSIGN[i % HUB_ASSIGN.length]];
    const statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "IN_SERVICE", "ACTIVE", "RESERVED"];
    await db.aircraft.upsert({
      where: { registration: f.reg },
      create: {
        registration: f.reg, type: f.type, name: f.name, manufacturer: f.mfr,
        categoryId: catIds[f.cat], hubId: airports[hubCode],
        status: statuses[i % statuses.length],
        capacityPax: f.pax, capacityCargoKg: f.cargo, isMilitary: f.mil ?? false,
        role: f.cat === "MILITARY" ? "Combat / Transport" : "Line Operations",
      },
      update: {},
    });
  }

  // ── Flight number ranges (configurable via admin settings) ──────
  await db.systemSetting.upsert({
    where: { key: "flight_number_ranges" },
    create: {
      key: "flight_number_ranges",
      value: JSON.stringify({
        PASSENGER: { base: 100, end: 499 }, CARGO: { base: 500, end: 699 },
        MILITARY: { base: 700, end: 799 }, GENERAL: { base: 800, end: 849 },
        SOVIET: { base: 850, end: 899 },
      }),
    },
    update: {},
  });

  // ── Routes ──────────────────────────────────────────────────────
  const usedNumbers = new Set<string>();
  for (const [oi, di, cat] of ROUTE_PAIRS) {
    const o = AIRPORTS[oi], d = AIRPORTS[di];
    const nm = distanceNm(o, d);
    let fn = flightNumberFor(cat);
    while (usedNumbers.has(fn)) fn = flightNumberFor(cat);
    usedNumbers.add(fn);
    const existing = await db.route.findFirst({ where: { originId: airports[o.code], destId: airports[d.code], category: { key: cat } } });
    if (existing) continue;
    await db.route.create({
      data: {
        flightNumber: fn, originId: airports[o.code], destId: airports[d.code],
        categoryId: catIds[cat], distanceNm: nm, durationMin: durationFor(nm),
        frequency: "DAILY",
      },
    });
  }

  // ── Qualifications + training courses ───────────────────────────
  const quals = [
    { key: "TYPE_A320", nameRu: "Type Rating Airbus A320", nameEn: "Type Rating Airbus A320", category: "TYPE_RATING" },
    { key: "TYPE_A350", nameRu: "Type Rating Airbus A350", nameEn: "Type Rating Airbus A350", category: "TYPE_RATING" },
    { key: "TYPE_B737", nameRu: "Type Rating Boeing 737", nameEn: "Type Rating Boeing 737", category: "TYPE_RATING" },
    { key: "TYPE_B777", nameRu: "Type Rating Boeing 777", nameEn: "Type Rating Boeing 777", category: "TYPE_RATING" },
    { key: "RATING_IFR", nameRu: "IFR Rating", nameEn: "IFR Rating", category: "RATING" },
    { key: "RATING_INTERNATIONAL", nameRu: "Международные рейсы", nameEn: "International Operations", category: "RATING" },
    { key: "MIL_JET", nameRu: "Военно-реактивная подготовка", nameEn: "Military Jet Qualification", category: "RATING" },
  ];
  for (const q of quals) {
    await db.qualification.upsert({ where: { key: q.key }, create: q, update: q });
  }
  const courses = [
    { key: "PPL_BASIC", titleRu: "Основы пилотирования", titleEn: "Basic Flight Training", descriptionRu: "Вводный курс для новых пилотов Meridian AIR: процедуры, радиообмен, основы навигации.", descriptionEn: "Entry course for new Meridian AIR pilots: procedures, radio phraseology, navigation basics.", category: "PASSENGER", durationH: 8 },
    { key: "JET_TRANSITION", titleRu: "Переучивание на реактивную технику", titleEn: "Jet Transition", descriptionRu: "Переход с винтовой на реактивную технику, высокоскоростной режим, автоматика.", descriptionEn: "Transition from prop to jet: high-speed regime, automation, energy management.", category: "PASSENGER", durationH: 12 },
    { key: "LINE_RATING_A320", titleRu: "Line Rating A320", titleEn: "Line Rating A320", descriptionRu: "Линейная эксплуатация Airbus A320 в Meridian AIR.", descriptionEn: "Airbus A320 line operations under Meridian AIR SOPs.", category: "PASSENGER", durationH: 16 },
    { key: "CARGO_OPS", titleRu: "Грузовые перевозки", titleEn: "Cargo Operations", descriptionRu: "Особенности грузовых операций: загрузка, W&B, длинные маршруты.", descriptionEn: "Cargo specifics: loading, weight & balance, long-haul procedures.", category: "CARGO", durationH: 10 },
    { key: "MIL_BASC", titleRu: "Военная лётная подготовка", titleEn: "Military Basic Flight Course", descriptionRu: "Базовая военная подготовка: строевой полёт, маневрирование, дозаправка.", descriptionEn: "Military basics: formation flight, maneuvering, air-to-air refueling.", category: "MILITARY", durationH: 20 },
    { key: "GA_CHECKRIDE", titleRu: "Checkride GA", titleEn: "General Aviation Checkride", descriptionRu: "Проверочный полёт для авиации общего назначения.", descriptionEn: "Checkride for general aviation operations.", category: "GENERAL", durationH: 4 },
    { key: "SOVIET_HERITAGE", titleRu: "Школа советской авиации", titleEn: "Soviet Aviation Heritage School", descriptionRu: "Особенности пилотирования Ту-154, Ан-24 и Як-40.", descriptionEn: "Flying the Tu-154, An-24 and Yak-40: soviet cockpit philosophy.", category: "SOVIET", durationH: 14 },
  ];
  for (const c of courses) {
    await db.trainingCourse.upsert({ where: { key: c.key }, create: c, update: c });
  }

  // ── Discord channel mapping (empty — filled via admin panel) ────
  for (const key of ["flight-bookings", "flight-reports", "live-flights", "pilot-applications", "system-logs", "announcements", "operations"]) {
    await db.discordChannel.upsert({ where: { key }, create: { key, channelId: "" }, update: {} });
  }

  // ── Setup admin account (secure mechanism, env-driven) ──────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@meridian-air.local";
  const adminPw = process.env.SEED_ADMIN_PASSWORD || "MeridianAdmin2026!";
  let admin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        email: adminEmail,
        name: "Meridian AIR Director",
        passwordHash: await bcrypt.hash(adminPw, 12),
        locale: "ru",
      },
    });
  }
  await upsertUserRole(admin.id, roleIds.GEN_PRESIDENT);
  await upsertUserRole(admin.id, roleIds.FLT_UNIVERSAL_CAPTAIN);
  const adminProfile = await db.pilotProfile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, pilotId: "MRD-0001", rankId: roleIds.FLT_UNIVERSAL_CAPTAIN, status: "ACTIVE", hubId: airports.UMKK },
    update: {},
  });
  await db.pilotProfile.update({ where: { id: adminProfile.id }, data: { pilotId: "MRD-0001" } });

  // ── Demo pilots ─────────────────────────────────────────────────
  const demo = [
    { name: "Alexey Sokolov", email: "sokolov@demo.meridian-air.local", rank: "FLT_CAPTAIN", hub: "UUEE", status: "ACTIVE", hours: 482, flights: 96 },
    { name: "Marina Volkova", email: "volkova@demo.meridian-air.local", rank: "FLT_SENIOR_FO", hub: "UMKK", status: "ACTIVE", hours: 254, flights: 51 },
    { name: "Igor Petrov", email: "petrov@demo.meridian-air.local", rank: "MRD_CARGO_PILOT", hub: "OMDB", status: "ACTIVE", hours: 613, flights: 118 },
    { name: "Dmitry Orlov", email: "orlov@demo.meridian-air.local", rank: "MRD_MILITARY_PILOT", hub: "UHHH", status: "ACTIVE", hours: 331, flights: 74 },
    { name: "Elena Zaytseva", email: "zaytseva@demo.meridian-air.local", rank: "MRD_VERIFIED_PILOT", hub: "LTFM", status: "VERIFIED", hours: 42, flights: 9 },
    { name: "Sergey Morozov", email: "morozov@demo.meridian-air.local", rank: "MRD_VERIFIED_PILOT", hub: "UMKK", status: "PENDING", hours: 0, flights: 0 },
  ];
  let seq = 2;
  for (const p of demo) {
    let u = await db.user.findUnique({ where: { email: p.email } });
    if (!u) {
      u = await db.user.create({
        data: {
          email: p.email, name: p.name,
          passwordHash: await bcrypt.hash("Demo2026!", 12),
          vatsimCid: String(1400000 + seq * 137), locale: "ru",
        },
      });
      await db.pilotProfile.create({
        data: {
          userId: u.id, pilotId: `MRD-${String(seq).padStart(4, "0")}`,
          rankId: roleIds[p.rank], hubId: airports[p.hub], status: p.status,
          hours: p.hours, flightsCount: p.flights, distanceNm: p.hours * 420,
        },
      });
      await db.userRole.create({ data: { userId: u.id, roleId: roleIds[p.rank] } });
      seq++;
    }
  }

  // ── Hub directors (demo staff) ──────────────────────────────────
  const hd = await db.user.findUnique({ where: { email: "sokolov@demo.meridian-air.local" } });
  if (hd) {
    for (const code of HUB_CODES) {
      await upsertUserRole(hd.id, roleIds.HUB_DIRECTOR, airports[code]);
    }
  }

  // ── News ────────────────────────────────────────────────────────
  const news = [
    {
      slug: "meridian-air-launches-a350-on-dxb-route",
      titleRu: "Meridian AIR открывает рейсы A350 в Дубай",
      titleEn: "Meridian AIR launches A350 service to Dubai",
      shortRu: "Флагманский Airbus A350-900 вышел на маршруты Калининград — Дубай.",
      shortEn: "Our flagship Airbus A350-900 enters service on the Kaliningrad — Dubai route.",
      contentRu: "Meridian AIR с гордостью объявляет о выводе флагманского Airbus A350-900 на маршрут UMKK — OMDB. Новая конфигурация салона на 325 мест, усовершенствованная развлекательная система и снижение расхода топлива на 25% по сравнению с предыдущим поколением. Бронирование открыто для всех верифицированных пилотов сети VATSIM и IVAO.",
      contentEn: "Meridian AIR is proud to introduce the flagship Airbus A350-900 on the UMKK — OMDB route. New 325-seat cabin configuration, next-generation IFE and 25% lower fuel burn versus the previous generation. Booking is open to all verified pilots on both VATSIM and IVAO.",
      category: "FLEET",
    },
    {
      slug: "flight-academy-intake-2026-q4",
      titleRu: "Набор в Лётную академию: четвёртый квартал 2026",
      titleEn: "Flight Academy intake: Q4 2026",
      shortRu: "Открыт приём заявок на базовый курс подготовки пилотов.",
      shortEn: "Applications are open for the basic pilot training course.",
      contentRu: "Лётная академия Meridian AIR объявляет новый набор. Курс включает 8 часов теории, тренировочные полёты и checkride с главным инструктором. Выпускники получают квалификацию MRD | Verified Pilot и доступ к бронированию пассажирских рейсов.",
      contentEn: "The Meridian AIR Flight Academy announces a new intake. The course includes 8 hours of ground school, training flights and a checkride with the Chief Instructor. Graduates receive the MRD | Verified Pilot qualification and access to passenger bookings.",
      category: "ACADEMY",
    },
    {
      slug: "cargo-division-expands",
      titleRu: "Грузовое подразделение расширяет маршрутную сеть",
      titleEn: "Cargo division expands its network",
      shortRu: "Boeing 747-8F выйдет на маршруты Дубай — Франкфурт.",
      shortEn: "The Boeing 747-8F enters the Dubai — Frankfurt corridor.",
      contentRu: "Грузовая дивизия Meridian AIR добавила три новых маршрута и второй Boeing 747-8F. Приоритет — тяжёлые грузы и чартерные перевозки по сети IVAO.",
      contentEn: "The Meridian AIR cargo division added three new routes and a second Boeing 747-8F. Priority: heavy freight and charter operations across the IVAO network.",
      category: "CARGO",
    },
  ];
  for (const n of news) {
    await db.news.upsert({
      where: { slug: n.slug },
      create: {
        ...n, shortRu: n.shortRu, authorId: admin.id, status: "PUBLISHED",
        publishedAt: new Date(Date.now() - Math.random() * 20 * 86400_000),
      },
      update: {},
    });
  }

  // ── Demo bookings + PIREP ───────────────────────────────────────
  const pilots = await db.pilotProfile.findMany({ include: { user: true } });
  const routes = await db.route.findMany({ include: { origin: true, dest: true, category: true } });
  const fleet = await db.aircraft.findMany({ include: { category: true } });
  if ((await db.booking.count()) === 0 && routes.length && fleet.length) {
    let bookSeq = 1;
    for (const p of pilots.slice(0, 4)) {
      const r = routes.find((x) => x.category.key === "PASSENGER") ?? routes[0];
      const ac = fleet.find((x) => x.categoryId === r.categoryId && x.status === "ACTIVE") ?? fleet[0];
      await db.booking.create({
        data: {
          code: `MRD-BOOK-${String(bookSeq++).padStart(6, "0")}`,
          userId: p.userId, routeId: r.id, aircraftId: ac.id, originId: r.originId,
          network: "VATSIM", operationType: r.category.key, flightNumber: r.flightNumber,
          scheduledAt: new Date(Date.now() + (12 + bookSeq * 6) * 3600_000),
          status: "BOOKED",
        },
      });
    }
    const p0 = pilots[0];
    if (p0) {
      const r = routes[0];
      const ac = fleet.find((x) => x.categoryId === r.categoryId) ?? fleet[0];
      await db.pirep.create({
        data: {
          code: "MRD-PIREP-000001", userId: p0.userId, aircraftId: ac.id,
          originId: r.originId, destCode: r.dest.code, flightNumber: r.flightNumber,
          callsign: `MRD${p0.pilotId.slice(-1)}${r.flightNumber.slice(3)}`,
          network: "VATSIM", depTime: new Date(Date.now() - 86400_000),
          arrTime: new Date(Date.now() - 86400_000 + r.durationMin * 60_000),
          durationMin: r.durationMin, distanceNm: r.distanceNm,
          status: "APPROVED", reviewType: "OPERATIONS",
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin account: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
