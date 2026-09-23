# REST API

Все ручки — под `/api/*`. Авторизация — httpOnly JWT cookie (`mrd_session`).
Разрешения проверяются **только на сервере**. Ошибки в едином формате:

```json
{ "error": "Missing permission: PIREP.APPROVE", "status": 403 }
```

## Auth

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | регистрация: name, email, password, vatsimCid, ivaoVid, discordId, hubCode, agreeRules:true → User + PilotProfile (PENDING) |
| POST | `/api/auth/login` | вход (rate limit 10/мин на IP) |
| POST | `/api/auth/signout` | выход |
| GET | `/api/auth/me` | текущий пользователь + роли + permissions (или `user:null`) |

## Операции

| Метод | Путь | Права | Описание |
|---|---|---|---|
| GET | `/api/bookings` | auth (BOOKINGS.READ — все, иначе свои) | список броней |
| POST | `/api/bookings` | auth + verified pilot | создать бронь; проверяет квалификацию звания, активность судна, категорию маршрута, конфликты окна судна |
| PATCH | `/api/bookings/[id]` | владелец или BOOKINGS.CANCEL/MANAGE | отмена (только статус BOOKED) |
| GET | `/api/pireps` | auth (PIREP.READ — все, иначе свои) | список PIREP |
| POST | `/api/pireps` | auth | подать PIREP (закрывает бронь, review-type по операции) |
| PATCH | `/api/pireps` | PIREP.APPROVE | approve/reject; при approve пересчитывается налёт пилота |

## Справочники (публичные)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/fleet?category=` | флот |
| GET | `/api/routes?category=&q=` | маршруты с поиском |
| GET | `/api/hubs` | хабы + счётчики + директора |
| GET | `/api/pilots` | ростер (VERIFIED/ACTIVE) |
| GET | `/api/news?slug=` | новости |
| GET | `/api/academy` | курсы + инструкторы |
| POST | `/api/academy` | записаться на курс (auth) |
| GET | `/api/statistics` | сводная статистика |
| GET | `/api/live` | MRD-рейсы на сети (VATSIM/IVAO) |

## Админ

| Метод | Путь | Права | Описание |
|---|---|---|---|
| GET | `/api/pilots/admin` | PILOTS.READ | полный список пилотов |
| PATCH | `/api/pilots/admin` | PILOTS.VERIFY / MANAGE / ROLES.MANAGE | actions: VERIFY, SUSPEND, ACTIVATE, SET_RANK, SET_HUB, ADD_ROLE, REMOVE_ROLE |
| GET | `/api/admin/roles` | ROLES.READ | роли + права + счётчики |
| GET | `/api/admin/audit` | AUDIT.READ | audit log (последние 200) |
| GET/PATCH | `/api/admin/settings` | SYSTEM.READ / CONFIGURE | настройки (flight number ranges) + маппинг Discord-каналов |
| POST/PATCH | `/api/admin/fleet` | FLEET.CREATE / EDIT | добавить судно, сменить статус/хаб |
| POST/DELETE | `/api/admin/routes` | ROUTES.CREATE / DELETE | создать маршрут (auto flight number), деактивировать |
| POST/DELETE | `/api/news/manage` | NEWS.CREATE / DELETE | создать/удалить новость (RU+EN) |
