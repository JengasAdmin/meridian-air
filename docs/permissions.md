# RBAC и permissions

Принцип: **права никогда не выдаются по названию роли**. Каждая роль связана с
группами прав, право имеет формат `DOMAIN.ACTION` (например, `BOOKINGS.CREATE`).

## Каталог групп (`src/lib/rbac.ts`)

`PILOTS`, `BOOKINGS`, `PIREP`, `FLEET`, `ROUTES`, `HUB`, `TRAINING`, `MILITARY`,
`CARGO`, `GENERAL`, `DISCORD`, `USERS`, `ROLES`, `SYSTEM`, `NEWS`, `ANALYTICS`,
`EVENTS`, `AUDIT`, `PERSONNEL` — каждая с действиями READ/CREATE/EDIT/DELETE/MANAGE
и т.п. Полный список — `ALL_PERMISSIONS` (~53 права).

## Роли

Заданы в `ROLE_DEFINITIONS` и заливаются seed-скриптом. Примеры:

- **GEN_PRESIDENT** — все права (`*`).
- Иерархия GEN (First VP → VP → General Director → …) — через наследование ролей
  (`inheritsId`): дочерняя роль получает права родителя.
- **MRD_HEAD_FCC** (Flight Control Center) — BOOKINGS, PIREP, ANALYTICS, FLEET, ROUTES.
- **HUB_DIRECTOR / HUB_DEPUTY** — назначаются **scoped по хабу** (UserRole.hubId):
  `requirePermission(perm, hubId)` проверяет роль именно в контексте хаба.
- Пилотские звания (`isPilotRank: true`) — прогрессия Verified Pilot → First Officer →
  … → Universal Captain; отдельные ветки Cargo и Military.

## Оргструктура

Seed покрывает ключевые должности ТЗ: руководство GEN, FCC, Personnel, Events,
Flight Training (Chief/Senior/Instructor), Military (Head, Squadron Commanders),
Cargo, Administrators, TECH (Lead Dev, SysAdmin), PR, VAT staff, Hub Directors
всех пяти хабов, ENG | International Pilot, организационная роль
`GEN | Meridian Virtual Airlines` (без прав по дизайну).

## Допуск к операциям (`CATEGORY_ELIGIBILITY`)

| Операция | Кtos бронирует |
|---|---|
| PASSENGER | Verified Pilot, FLT FO/Senior FO/Captain/Senior Captain/Universal, ENG International |
| CARGO | Cargo Pilot, Senior Cargo Pilot, Captain+ |
| MILITARY | Military Pilot, Senior Military, Squadron flights, Universal Captain |
| GENERAL / SOVIET | Verified Pilot+, Cargo/Military Pilot тоже допущены |

Проверка выполняется на сервере при `POST /api/bookings` и не зависит от UI.

## Audit Log

Все ключевые действия (`PILOT_VERIFIED`, `BOOKING_CREATED/CANCELLED`,
`PIREP_APPROVED/REJECTED`, `ROLE_ASSIGNED`, `FLEET_UPDATED`, `ROUTE_CREATED`,
`NEWS_CREATED`, `SYSTEM_SETTINGS_UPDATED`, `LOGIN`) пишутся в `AuditLog`
с пользователем, target, old/new value, IP и User-Agent. Просмотр — `/admin/audit`
(право `AUDIT.READ`).
