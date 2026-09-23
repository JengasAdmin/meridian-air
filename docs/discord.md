# Discord

## Два канала интеграции

1. **Web-приложение → webhooks** (`src/lib/discord.ts`): Booking, PIREP и новости
   отправляют embed в webhook канала. Webhooks задаются переменными
   `DISCORD_WEBHOOK_BOOKINGS`, `DISCORD_WEBHOOK_PIREPS`, `DISCORD_WEBHOOK_ANNOUNCEMENTS`
   или настройками `discord.webhooks.<key>` в SystemSetting. Без webhook — тихий
   dev-fallback: только in-app Notification.
2. **Бот Gateway** (`bot/index.ts`, `npm run bot`): slash-команды и чтение маппинга
   каналов из таблицы `DiscordChannel` (редактируется в `/admin/settings`).

## Setup

1. Discord Developer Portal → New Application → Bot → скопировать токен.
2. `.env`:
   ```
   DISCORD_TOKEN=...
   DISCORD_CLIENT_ID=...   # Application ID
   DISCORD_GUILD_ID=...    # ID сервера Meridian AIR (для мгновенной регистрации команд)
   ```
3. Пригласить бота с scopes `bot applications.commands` и правом отправки сообщений
   в целевые каналы.
4. `npm run bot`. Без токена процесс завершается с понятным сообщением (dev fallback).
5. В `/admin/settings` заполнить Channel ID для ключей: `flight-bookings`,
   `flight-reports`, `live-flights`, `pilot-applications`, `system-logs`,
   `announcements`, `operations`.

## Slash-команды

| Команда | Описание |
|---|---|
| `/pilot` | профиль пилота (связка по Discord ID в аккаунте) |
| `/booking` | активные брони вызывающего пилота |
| `/pirep` | последние PIREP |
| `/flight code:MRD-BOOK-000005` | карточка брони |
| `/fleet` | сводка флота по категориям |
| `/routes icao:UMKK` | маршруты из аэропорта |
| `/stats` | статистика авиакомпании |
| `/status` | статус систем |

## События → каналы

- `flight-bookings` — новый Booking (embed: Booking ID, Pilot, Flight, Route, Network, Status, дата)
- `flight-reports` — новый PIREP
- `announcements` — системные объявления (новости и т.д.)

Автоматическое создание thread под booking выполняется ботом при наличии права
`Manage Threads` (embed содержит Booking ID — thread naming детерминирован).
