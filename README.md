# FBO Inventory

MVP веб-приложения для учета готовых FBO-товаров в небольшом 3D-печатном производстве.

## Стек

- Next.js App Router + TypeScript
- SQLite + Prisma
- Tailwind CSS
- PIN-авторизация сотрудников
- Сканирование штрихкодов через browser camera API и `@zxing/browser`

## Возможности MVP

- Главный экран с 4 крупными действиями: добавить готовый товар, взять товар, проверить остаток, коррекция.
- Товары ищутся по названию, `internal_sku`, `ozon_offer_id`, штрихкоду, категории и `search_aliases`.
- На выборе товара есть быстрый поиск, последние товары и кнопка сканирования.
- Остатки не редактируются напрямую. Они считаются суммой `StockMovement.quantityDelta`.
- Расход защищен от списания в минус. При нехватке показывается предупреждение и ссылка на коррекцию.
- Причины расхода: Поставка Ozon, FBS, Яндекс, Авито, СДЭК, Брак, Доработка, Другое.

## Быстрый старт локально

```bash
npm install
copy .env.example .env
npm run prisma:apply:init
npm run prisma:seed
npm run dev
```

Откройте `http://localhost:3000`.

На Windows `prisma migrate dev` в этом проекте может падать пустой ошибкой schema engine. Для локального применения SQL-миграций используйте `npm run prisma:apply:init`: helper применяет checked-in миграции без запуска schema engine. Для новых локальных миграций можно пробовать `npm run prisma:migrate -- --name <name>`, а в production нужно использовать только `npm run prisma:deploy`.

`npm run prisma:apply:init` безопасен для повторного запуска: локально он ведет таблицу `_local_migrations`, применяет только новые SQL-миграции и пишет в консоль `applied` / `skipped`.

Seed-сотрудники:

- Анна: PIN `1111`
- Борис: PIN `2222`

Seed предназначен только для пустой локальной демо-базы. Если в базе уже есть товары, сотрудники или движения, `npm run prisma:seed` остановится и не будет перетирать данные. Для осознанного сброса локальной демо-базы временно задайте `RESET_DEMO_DATA=1`.

## Команды

```bash
npm run dev              # dev-сервер
npm run build            # Prisma generate + production build
npm run start            # production server после build
npm run prisma:migrate   # новая локальная миграция
npm run prisma:apply:init # применить локальные SQL-миграции без prisma migrate dev
npm run prisma:deploy    # применить миграции на сервере
npm run prisma:seed      # заполнить пустую локальную демо-базу
```

## Миграции базы

Локальное создание или обновление базы на Windows:

```bash
npm run prisma:apply:init
```

Команду можно запускать повторно: уже учтенные миграции будут пропущены.

Обычная локальная разработка миграций, если `prisma migrate dev` работает в вашей среде:

```bash
npm run prisma:migrate -- --name <name>
```

На VPS/production:

```bash
npm run prisma:deploy
```

SQLite-файл по умолчанию лежит как `prisma/dev.db`, потому что в `.env.example` указано:

```env
DATABASE_URL="file:./dev.db"
```

Для production можно оставить SQLite, но лучше хранить базу в постоянной директории и делать регулярные бэкапы.

## Деплой на VPS без платных сервисов

1. Установите Node.js 22+ и Git.
2. Склонируйте репозиторий на сервер.
3. Создайте `.env`:

```env
DATABASE_URL="file:./production.db"
AUTH_SECRET="длинная-случайная-строка"
PIN_HASH_SECRET="другая-длинная-случайная-строка"
```

`AUTH_SECRET` и `PIN_HASH_SECRET` обязательны. Если их нет, серверная часть завершится с понятной ошибкой; значения `change-me-before-production` допустимы только для локальной проверки, не для production.

4. Установите зависимости и подготовьте базу:

```bash
npm ci
npm run prisma:deploy
npm run build
```

5. Запустите приложение через systemd или pm2:

```bash
npm run start -- -p 3000
```

6. Поставьте Nginx reverse proxy на `127.0.0.1:3000` и включите HTTPS, например через Let's Encrypt.

Важно: если меняете `PIN_HASH_SECRET` после seed, пересоздайте сотрудников или запустите seed заново, иначе старые PIN-хэши не совпадут.
