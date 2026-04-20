# Deployment Guide

## 1) Минимальная боевая схема
- PostgreSQL: ваш существующий кластер.
- Backend: контейнер `ASP.NET Core API`.
- Frontend: статический React build (Nginx / Vercel / Render Static Site).

## 2) Переменные окружения backend
- `ConnectionStrings__DefaultConnection=Host=...;Port=5432;Database=...;Username=...;Password=...`
- `Jwt__Issuer=AutoWrap.Platform`
- `Jwt__Audience=AutoWrap.Platform.Client`
- `Jwt__Key=<длинный ключ минимум 32 символа>`
- `Cors__AllowedOrigins__0=https://your-frontend-domain.com`
- `ASPNETCORE_ENVIRONMENT=Production`

## 3) Миграции PostgreSQL
Запуск из корня репозитория:

```bash
dotnet ef database update \
  --project src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj \
  --startup-project src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj
```

Создание новой миграции:

```bash
dotnet ef migrations add <MigrationName> \
  --project src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj \
  --startup-project src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj \
  --output-dir Infrastructure/Data/Migrations
```

## 4) Backend deploy (Docker)
Сборка:

```bash
docker build -f src/AutoWrap.Platform.Api/Dockerfile -t autowrap-api:latest .
```

Запуск:

```bash
docker run -d --name autowrap-api -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ConnectionStrings__DefaultConnection="Host=...;Port=5432;Database=...;Username=...;Password=..." \
  -e Jwt__Issuer="AutoWrap.Platform" \
  -e Jwt__Audience="AutoWrap.Platform.Client" \
  -e Jwt__Key="CHANGE_THIS_TO_LONG_SECRET" \
  -e Cors__AllowedOrigins__0="https://your-frontend-domain.com" \
  autowrap-api:latest
```

## 5) Frontend deploy
### Вариант A: статический хостинг
- Build command: `npm run build`
- Publish directory: `dist`
- Env: `VITE_API_BASE_URL=https://your-api-domain.com`

### Вариант B: Docker + Nginx

```bash
docker build -f src/AutoWrap.Platform.Web/Dockerfile -t autowrap-web:latest \
  --build-arg VITE_API_BASE_URL=https://your-api-domain.com .

docker run -d --name autowrap-web -p 8081:80 autowrap-web:latest
```

## 6) Проверка после выката
- `GET https://your-api-domain.com/api/health` -> `200 OK`
- Логин через UI
- Создание заказа
- Отклик исполнителя
- Проверка избранного и профиля
