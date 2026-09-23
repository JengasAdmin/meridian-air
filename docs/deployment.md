# Деплой

## Supabase (PostgreSQL, free tier)

1. Создать проект на [supabase.com](https://supabase.com) (Free).
2. `Settings → Database → Connection string (Session pooler)` — это `DATABASE_URL`.
3. В `prisma/schema.prisma`: `provider = "postgresql"`.
4. Применить схему и seed:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   DATABASE_URL="postgresql://..." npm run db:seed
   ```
   Seed идемпотентен (upsert) и создаёт админ-аккаунт из `SEED_ADMIN_EMAIL` /
   `SEED_ADMIN_PASSWORD` — задайте продакшен-значения и после первого входа
   смените пароль.

## Hosting веб-приложения (free tier)

Подходит любая платформа с поддержкой Next.js: **Vercel**, Railway, Fly.io.

Build: `npm run build` · Start: `npm start`

Environment variables — все из `.env.example` (кроме локального SEED-пароля):
`DATABASE_URL`, `AUTH_SECRET` (обязательно 32+ случайных символа),
`DISCORD_WEBHOOK_*`, `IVAO_API_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Discord-бот

Отдельный процесс (`npm run bot`) на Railway / Fly.io / VPS — ему нужны те же
`DATABASE_URL` + `DISCORD_TOKEN/CLIENT_ID/GUILD_ID`. Ограничение бесплатных
платформ: бот — постоянно живой процесс; на Vercel его запускать нельзя.

## CI (GitHub)

Простейший пайплайн (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma db push   # локальный SQLite для тестов
      - run: npx tsx prisma/seed.ts
      - run: npx vitest run
      - run: npm run build
```

## Чек-лист после деплоя

- [ ] `DATABASE_URL` → Supabase Postgres, схема+seed применены
- [ ] `AUTH_SECRET` уникальный для продакшена
- [ ] Пароль seeded-админа изменён
- [ ] `NEXT_PUBLIC_SITE_URL` = публичный домен (sitemap/OG)
- [ ] Discord webhooks / токен бота заполнены
- [ ] Проверить `/`, `/book`, `/admin` под продакшен-аккаунтом

## Ограничения бесплатной инфраструктуры

- Supabase Free: пауза проекта после ~1 недели неактивности (лечится пингом/апгрейдом).
- Vercel Free: serverless-лимиты (долгий live-polling лучше делать на клиенте — так и сделано).
- IVAO API key выдаётся бесплатно, но по заявке.
