# Руководство разработчика

## Запуск

```bash
npm install
npm run db:push     # SQLite prisma/dev.db
npm run db:seed     # демо-данные (идемпотентно)
npm run dev         # http://localhost:3000
npm test            # vitest
npm run build       # продакшен-сборка
```

Полный сброс БД: `npm run db:reset`.

## Структура кода

- `src/app/api/**/route.ts` — REST endpoints. Права — `requirePermission()`.
- `src/app/**/page.tsx` — страницы. Публичные — Server Components (прямой доступ к БД),
  приватные — клиентские через API.
- `src/lib/` — доменная логика; добавление новой бизнес-проверки → `operations.ts`,
  нового права → `rbac.ts` (группа + роль в `ROLE_DEFINITIONS`).
- `src/i18n/` — RU/EN словари. **Ключи должны совпадать** (тест `tests/i18n.test.ts`).

## Добавить язык (например DE)

1. `src/i18n/de.ts` — копия ключей из `ru.ts` с переводами (`Dict`-тип проверит полноту).
2. `src/i18n/server.ts` / `client.tsx` — добавить в словари и тип `Lang`.
3. Расширить enum локали в `register/route.ts` (`z.enum(["ru","en","de"])`).

## Добавить сущность

1. Модель в `prisma/schema.prisma` → `npm run db:push`.
2. REST: `src/app/api/<domain>/route.ts` c `requirePermission()`.
3. Страница/админ-раздел + пункт в `AdminNav` с правом.

## Соглашения

- Все пользовательские строки — только через словари (без хардкода в компонентах).
- Секреты — только в `.env` (`.env` в `.gitignore`).
- Каждое административное действие — через `audit()`.
- Ошибки API — `apiError(e)` (без stack trace наружу).

## Тесты

`tests/` — Vitest. Покрыты RBAC-каталог (полнота, наследование, матрица допусков)
и паритет словарей RU/EN. Запуск: `npm test`.
