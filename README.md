# AutoWrap Platform Beta

Текущий стек:
- Backend: ASP.NET Core Web API (.NET 8)
- ORM: EF Core 8 + migrations
- DB: PostgreSQL
- Auth: JWT
- Frontend: React + TypeScript + Vite (отдельный проект)

## Структура
- `src/AutoWrap.Platform.Api` — API
- `src/AutoWrap.Platform.Web` — SPA клиент
- `docs/BUSINESS_PROCESS_V1.md` — бизнес-сценарий V1
- `docs/DEPLOYMENT_GUIDE.md` — деплой и хостинг

## Локальный запуск (Windows PowerShell)

### 0) Подготовка (один раз)
Из корня проекта:

```powershell
dotnet restore AutoWrapPlatform.sln
```

### 1) Настройка backend подключения к БД
Создай локальный файл настроек из шаблона:

```powershell
Copy-Item src/AutoWrap.Platform.Api/appsettings.Development.example.json src/AutoWrap.Platform.Api/appsettings.Development.json
```

Открой файл:
- `src/AutoWrap.Platform.Api/appsettings.Development.json`

И укажи свою строку подключения PostgreSQL:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=<host>;Port=5432;Database=<db>;Username=<user>;Password=<password>"
}
```

### 2) Накатить миграции
Из корня проекта:

```powershell
dotnet ef database update `
  --project src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj `
  --startup-project src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj
```

### 3) Запустить backend (Терминал №1)
Из корня проекта:

```powershell
dotnet run --project src/AutoWrap.Platform.Api/AutoWrap.Platform.Api.csproj --launch-profile https
```

Проверка:
- Swagger: `https://localhost:7001/swagger`
- Health: `https://localhost:7001/api/health`

### 4) Запустить frontend (Терминал №2)

```powershell
cd src/AutoWrap.Platform.Web
Copy-Item .env.example .env
Set-Content .env "VITE_API_BASE_URL=https://localhost:7001"
npm install
npm run dev
```

Открыть в браузере:
- `http://127.0.0.1:5173/`
- если не открылось, `http://localhost:5173/`

## Docker (опционально)
```bash
docker compose up --build
```

Сервисы:
- API: `http://localhost:8080`
- Frontend: `http://localhost:8081`
- PostgreSQL: `localhost:5432`

## Demo users (seed только для Development)
- `customer@demo.local` / `Demo123!`
- `wrapper@demo.local` / `Demo123!`

## Что уже есть в API
- Регистрация/логин/JWT
- Роли (`Customer`, `Wrapper`, `Admin`)
- Заказы: создание/список/детали/статус
- Отклик на заказ
- Избранное
- Профиль и персональные выборки

## Следующий шаг
Детализация доменной модели под роли `Advertiser`, `CarOwner`, `WrapCompany` и переход от UI-driven требований к process-driven backend (см. `docs/BUSINESS_PROCESS_V1.md`).
