# Meridian AIR — Virtual Airlines Platform

Полноценная платформа виртуальной авиакомпании **Meridian AIR** (ICAO: MRD) для сетей
**VATSIM** и **IVAO**: публичный сайт, система пилотов, бронирование рейсов, PIREP,
флот, маршруты, хабы, лётная академия, Discord-бот, админ-панель с RBAC, RU/EN.

**Live:** https://meridian-air-va.vercel.app

![stack](https://img.shields.io/badge/Next.js-14-black) ![ts](https://img.shields.io/badge/TypeScript-strict-blue) ![db](https://img.shields.io/badge/Prisma-SQLite%20%2F%20PostgreSQL-blueviolet)

---

## Стек

| Слой | Технология |
|---|---|
| Full-stack / Frontend | **Next.js 14 (App Router) + TypeScript + Tailwind CSS** |
| БД / ORM | **Prisma** — SQLite для локальной разработки, PostgreSQL (Supabase Free) для продакшена |
| Auth | JWT (jose) в httpOnly-cookie + bcryptjs |
| RBAC | Role → Permission Groups → `DOMAIN.ACTION` (см. `docs/permissions.md`) |
| Discord | discord.js v14 (отдельный процесс) + webhook-интеграция из веб-приложения |
| Интеграции | VATSIM public data feed (без ключа), IVAO REST API (ключ `IVAO_API_KEY`) |
| Тесты | Vitest |

## Быстрый старт (локально)

```bash
git clone https://github.com/JengasAdmin/meridian-air.git
cd meridian-air
npm install
cp .env.example .env        # при необходимости поправьте значения
npm run db:push             # создаст prisma/dev.db (SQLite)
npm run db:seed             # хабы, флот, роли, маршруты, демо-данные
npm run build && npm start  # http://localhost:3000
# либо в dev-режиме: npm run dev
```

Первый вход администратора создаётся seed-скриптом из переменных
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (в `.env` для локальной разработки).
**Никогда не используйте локальные пароли в продакшене.**

## Discord-бот

```bash
npm run bot
```

Требует `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` в `.env`.
Без токена бот корректно отключается (documented dev fallback). Команды:
`/booking /pirep /pilot /flight /fleet /routes /stats /status`.
Привязка каналов — в админ-панели (`/admin/settings`), хранится в БД.

## Основные страницы

- `/` — главная (Hero, Live Operations, сеть, флот, направления, новости, CTA)
- `/fleet`, `/routes`, `/hubs`, `/hubs/[ICAO]`, `/pilots`, `/academy`, `/news`, `/about`
- `/live` — рейсы с коллсайном MRD на сети VATSIM/IVAO (обновление раз в минуту)
- `/statistics` — сводка по авиакомпании, хабам и флоту
- `/book` — бронирование (7 шагов: операция → маршрут → судно → сеть → дата → проверка → подтверждение)
- `/profile` — профиль пилота (Pilot ID, звание, часы, брони, PIREP)
- `/login`, `/register` — вход/регистрация (статус заявки — PENDING → Verified)
- `/admin` — админ-панель (дашборд, пилоты, брони, PIREP, флот, маршруты, роли, новости, Discord, Audit Log)

## Переменные окружения

См. `.env.example`. Ключевые: `DATABASE_URL`, `AUTH_SECRET`, `DISCORD_TOKEN`,
`DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `DISCORD_WEBHOOK_*`, `IVAO_API_KEY`,
`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`.

## Деплой (Supabase + hosting)

1. Создайте бесплатный проект на [supabase.com](https://supabase.com) (PostgreSQL).
2. В `prisma/schema.prisma` смените `provider = "sqlite"` → `"postgresql"`.
3. `DATABASE_URL` = connection string Supabase (Session pooler).
4. `npx prisma db push && npm run db:seed`.
5. Задеплойте Next.js на любой free-tier платформе (Vercel / Railway / Fly.io):
   build `npm run build`, start `npm start`, переменные — из `.env.example`.
6. Бот (`npm run bot`) запускается отдельным процессом на Railway/FS/VPS.

Подробнее: `docs/deployment.md`.

## Структура

```
prisma/          схема БД + seed
src/app/         страницы и REST API (App Router)
src/lib/         auth, rbac, operations, integrations, discord, audit
src/i18n/        словари RU/EN (добавление языка — см. docs/development.md)
src/components/  Navbar, Footer, UI-kit, LiveOpsTeaser
bot/             Discord-бот (discord.js v14)
tests/           Vitest (RBAC, i18n)
docs/            architecture, database, api, discord, deployment, integrations, permissions, development
```

## Документация

- [docs/architecture.md](docs/architecture.md) — общая архитектура
- [docs/database.md](docs/database.md) — модель данных
- [docs/api.md](docs/api.md) — REST API
- [docs/permissions.md](docs/permissions.md) — RBAC и матрица допусков
- [docs/discord.md](docs/discord.md) — бот и настройка каналов
- [docs/integrations.md](docs/integrations.md) — VATSIM / IVAO
- [docs/deployment.md](docs/deployment.md) — продакшен-деплой
- [docs/development.md](docs/development.md) — как продолжить разработку

## Лицензия

Проект создан для сообщества виртуальной авиации Meridian AIR.
Meridian AIR — виртуальная авиакомпания, не является реальным перевозчиком.
