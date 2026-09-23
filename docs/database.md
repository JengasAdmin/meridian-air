# Модель данных

ORM: Prisma. Локально SQLite (`file:./dev.db`), продакшен — PostgreSQL (Supabase).
Схема написана портируемой: смена провайдера в `prisma/schema.prisma` + `DATABASE_URL`.

## Основные сущности

| Модель | Назначение |
|---|---|
| `User` | аккаунт: email, passwordHash (bcrypt), Discord ID, VATSIM CID, IVAO VID, локаль |
| `PilotProfile` | Pilot ID (`MRD-0001`), звание (Role), хаб, статус (PENDING/VERIFIED/ACTIVE/…), налёт, рейсы, дистанция |
| `Role` / `Permission` / `RolePermission` | RBAC: роли с наследованием (`inheritsId`), права `DOMAIN.ACTION` |
| `UserRole` | назначение роли; `hubId` — опциональный scope (Hub Director конкретного хаба) |
| `Airport` | ICAO/IATA, город/страна (RU+EN), координаты; `isHub` — хабы сети |
| `AircraftCategory` | PASSENGER / CARGO / MILITARY / GENERAL / SOVIET |
| `Aircraft` | регистрация, тип, производитель, категория, хаб, статус (ACTIVE/MAINTENANCE/…), вместимость |
| `Route` | flight number, origin/dest, категория, дистанция, длительность, частота |
| `Booking` | код `MRD-BOOK-000001`, пилот, маршрут, судно, сеть, `scheduledAt`, статус |
| `Flight` | live-трекинг брони: callsign, статус, lat/lon, эшелон, скорость |
| `Pirep` | код `MRD-PIREP-000001`, статус (PENDING/APPROVED/…), тип ревью (AUTO/INSTRUCTOR/OPERATIONS) |
| `Qualification` / `PilotQualification` | type ratings и рейтинги |
| `TrainingCourse` / `TrainingRecord` | Лётная академия: курсы и зачисления |
| `News` | RU+EN версии, slug, категория, автор, статус |
| `Event` / `EventParticipant` | события авиакомпании |
| `DiscordChannel` | маппинг logical key → channel ID (меняется в админке) |
| `SystemSetting` | конфиги: диапазоны flight numbers, Discord webhooks, счётчики кодов |
| `AuditLog` | кто/что/старое/новое/IP/UA — все административные действия |
| `Notification` | in-app уведомления |

## Индексы и целостность

- unique: email, pilotId, registration, flightNumber, booking/pirep codes, роль+хаб
- index: `Pirep.userId`, `Pirep.status`, `UserRole.userId`, `AuditLog.action/createdAt`,
  `Route.originId/destId`, `Notification.userId+read`
- FK с каскадами (UserRole, Pirep, TrainingRecord) + timestamps на изменяемых моделях.

## Миграции

Разработка: `npm run db:push` (schema sync). Для продакшена с историей миграций:
`npx prisma migrate dev --name init` и коммит папки `prisma/migrations`.
