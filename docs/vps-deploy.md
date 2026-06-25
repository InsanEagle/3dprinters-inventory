# Запуск inventory на VPS через Docker Compose

Эта инструкция описывает production-like запуск inventory рядом с основным сайтом. Приложение будет слушать только локальный адрес VPS, например `127.0.0.1:3001`, а наружу его должен отдавать внешний reverse proxy с HTTPS.

## Что получится

- Контейнер `inventory` с Next.js production build.
- SQLite-база в постоянной папке `data/production.db`.
- Бэкапы в папке `backups/`.
- Порт наружу не открывается: bind только на `127.0.0.1`.

## 1. Подготовить env и папки

На VPS в папке проекта:

```bash
cp .env.production.example .env.production
mkdir -p data backups
```

Заполните `.env.production`:

```env
DATABASE_URL="file:../data/production.db"
AUTH_SECRET="длинная-случайная-строка"
PIN_HASH_SECRET="другая-длинная-случайная-строка"
APP_PORT=3001
```

Секреты можно сгенерировать так:

```bash
openssl rand -base64 32
```

Файл `.env.production` не должен попадать в Git.

Если контейнер не сможет писать в `data/` или `backups/`, проверьте права на эти папки. Обычно достаточно, чтобы они принадлежали пользователю, от которого запускается Docker Compose.

## 2. Собрать образ

```bash
docker compose --env-file .env.production build
```

Во время сборки Docker использует безопасные dummy-значения `AUTH_SECRET` и `PIN_HASH_SECRET`, чтобы Next.js мог собрать страницы. Настоящие секреты не нужно передавать в build args: они задаются только в `.env.production` и используются контейнером при запуске.

## 3. Подготовить базу

Перед первым запуском и после обновлений с миграциями:

```bash
docker compose --env-file .env.production run --rm inventory npm run prisma:deploy
```

После этого база должна лежать здесь:

```text
data/production.db
```

## 4. Запустить приложение

```bash
docker compose --env-file .env.production up -d
```

По умолчанию inventory будет доступен только локально на VPS:

```text
http://127.0.0.1:3001
```

Если нужно использовать другой локальный порт, поменяйте `APP_PORT` в `.env.production`.

## 5. Проверить запуск

Посмотреть состояние контейнера:

```bash
docker compose --env-file .env.production ps
```

Посмотреть логи:

```bash
docker compose --env-file .env.production logs -f inventory
```

Проверить login-страницу локально на VPS:

```bash
curl -I http://127.0.0.1:3001/login
```

Ожидаемый результат: HTTP-ответ без ошибки соединения.

Если в логах появилась ошибка Prisma про `debian-openssl-3.0.x`, пересоберите образ без старого кеша и снова примените миграции:

```bash
docker compose --env-file .env.production build --no-cache
docker compose --env-file .env.production run --rm inventory npm run prisma:deploy
docker compose --env-file .env.production up -d
```

В образе для `node:22-bookworm-slim` Prisma Client должен быть сгенерирован с query engine для `debian-openssl-3.0.x`.

## 6. Пример reverse proxy через Nginx

Пример для поддомена `inventory.example.com`:

```nginx
server {
    listen 80;
    server_name inventory.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTPS лучше включать на внешнем Nginx, например через Let's Encrypt.

Если используется Caddy, минимальный пример такой:

```caddy
inventory.example.com {
    reverse_proxy 127.0.0.1:3001
}
```

Caddy сам может выпустить и продлить HTTPS-сертификат, если домен уже смотрит на VPS.

## 7. Сделать backup

Вручную:

```bash
docker compose --env-file .env.production exec inventory npm run backup:db
```

Бэкап появится в папке:

```text
backups/
```

Важно: бэкап, который лежит только на том же VPS, не спасает при потере сервера. Периодически скачивайте backup-файлы на свой компьютер или в другое безопасное место.

Перед обновлением приложения всегда делайте backup.

## 8. Обновить приложение

Обычный порядок:

```bash
docker compose --env-file .env.production exec inventory npm run backup:db
git pull
docker compose --env-file .env.production build
docker compose --env-file .env.production run --rm inventory npm run prisma:deploy
docker compose --env-file .env.production up -d
docker compose --env-file .env.production logs -f inventory
```

После обновления проверьте:

```bash
curl -I http://127.0.0.1:3001/login
```

## 9. Откатиться назад

Если проблема только в коде:

```bash
git checkout <предыдущий-коммит-или-тег>
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
```

Если проблема затронула данные:

1. Остановите приложение.
2. Сделайте копию текущей базы, даже если она плохая.
3. Верните нужный backup-файл поверх `data/production.db`.
4. Запустите приложение снова.

Команды:

```bash
docker compose --env-file .env.production down
cp data/production.db data/production-before-rollback.db
cp backups/<нужный-backup-файл>.db data/production.db
docker compose --env-file .env.production up -d
```

После отката откройте `/stock/check` или `/movements` и проверьте, что данные соответствуют выбранному бэкапу.
