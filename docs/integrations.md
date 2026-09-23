# Интеграции VATSIM / IVAO

Архитектура — `src/lib/integrations.ts`, общий интерфейс `NetworkPilot`:
`callsign, userId, aircraft, departure, arrival, altitudeFt, speedKt, headingDeg, lat, lon, network`.

## VATSIM

Официальный публичный data feed — **ключ не требуется**:

```
https://data.vatsim.net/v3/vatsim-data.json
```

Сервис `vatsimPilots()` нормализует пилотов фида. Обновление кэша — 60 сек,
таймаут 10 сек, 3 попытки с backoff. При недоступности фида возвращается пустой
массив (платформа продолжает работать) + запись в server log.

## IVAO

Официальный REST API требует **API key** (`IVAO_API_KEY` в `.env`).
Без ключа активен dev-adapter: `ivaoPilots()` возвращает пустой, но валидный
результат — весь пайплайн (live map, статистика, трекинг) работает.

Для продакшена: получить ключ в IVAO API-портале и добавить
`IVAO_API_KEY=...`. Нормализация ответа IVAO описана в `ivaoPilots()` —
при изменении схемы v2 правится один маппер.

## Использование

- `/api/live` и страница `/live` — рейсы с коллсайном `MRD*` (VATSIM + IVAO).
- `findLiveByCallsign()` — для Flight Tracking: Booking → callsign → живые данные
  (позиция, эшелон, скорость) → обнаружение посадки → генерация отчёта.
- `/api/statistics` — `liveNow`.

## Правила

Только официальные/документированные endpoints, никакого агрессивного скрапинга:
кэш 60 сек, таймауты, retry с backoff, обработка ошибок и логирование.
