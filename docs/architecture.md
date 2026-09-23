# Архитектура Meridian AIR

## Обзор

Единое full-stack приложение **Next.js 14 (App Router)**: серверные компоненты рендерят
публичные страницы напрямую из БД, клиентские компоненты работают с REST API.
Дискорд-бот — отдельный процесс, работающий с той же БД.

```
┌────────────────────────────────────────────────────┐
│                  Next.js (web)                     │
│  Server Components ── Prisma ──► SQLite/Postgres   │
│  Client Components ── REST /api/* ──► auth+RBAC    │
│  Webhooks ──► Discord channels (embeds)            │
└──────────────┬─────────────────────────────────────┘
               │ та же БД
┌──────────────▼─────────────┐   ┌──────────────────┐
│      Discord Bot (bot/)    │   │  VATSIM / IVAO   │
│  discord.js Gateway + REST │   │  data feeds      │
└────────────────────────────┘   └──────────────────┘
```

## Слои

- **src/lib/db.ts** — Prisma singleton.
- **src/lib/auth.ts** — JWT-сессии (jose, httpOnly cookie), `getSessionUser()`,
  `requireUser()`, `requirePermission(perm, hubId?)`. Разрешения резолвятся на сервере
  с учётом наследования ролей и hub-scoped ролей. Фронтенд не доверяется никогда.
- **src/lib/rbac.ts** — каталог прав (`DOMAIN.ACTION`), определения ролей, матрица
  `CATEGORY_ELIGIBILITY` (какие звания какие типы операций бронируют).
- **src/lib/operations.ts** — генерация номеров (`MRD-BOOK-…`, `MRD-PIREP-…`, Pilot ID,
  flight numbers по диапазонам), проверка конфликтов бронирования, review-type PIREP.
- **src/lib/discord.ts** — Discord-интеграция веб-приложения: in-app Notification
  (всегда) + webhook в канал (если настроен). Dev-режим без вебхуков — no-op.
- **src/lib/integrations.ts** — `VATSIMService`/`IVAODepartures` с кэшем 60 сек,
  таймаутами, retry и dev-adapter (пустой результат без ключа/сети).
- **src/lib/audit.ts** — запись audit log и единый формат ошибок API.

## Потоки данных

1. **Booking**: UI wizard → `POST /api/bookings` → проверка (пилот верифицирован,
   звание допущено к операции, судно активно, окно свободно) → создание → audit log →
   Discord embed (`flight-bookings`).
2. **PIREP**: пилот подаёт отчёт → `reviewTypeFor()` определяет AUTO/INSTRUCTOR/OPERATIONS →
   `PATCH /api/pireps` (PIREP.APPROVE) → налёт пилота пересчитывается → audit log.
3. **Live**: `/api/live` → `networkPilots()` (VATSIM feed + IVAO) → фильтр `MRD*`.
4. **Регистрация**: User + PilotProfile (PENDING, следующий MRD-XXXX) → персонал
   верифицирует в `/admin/pilots` → статус VERIFIED + звание MRD | Verified Pilot.

## Публичные vs приватные страницы

Публичные страницы — Server Components, читают БД напрямую (SEO + скорость).
Приватные (`/profile`, `/admin/*`, `/book`) — клиентские, работают через `/api/*`
с серверной авторизацией.
