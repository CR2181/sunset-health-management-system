# Sunset Health Backend

NestJS backend for the养老院智慧健康管理系统. It uses TypeORM and supports PostgreSQL by default, with MySQL available through `DB_TYPE=mysql`.

## Quick Start

This computer already has a portable MariaDB runtime installed under `backend/.runtime`. It does not require administrator permissions or a Windows service.

Start the full local service:

```powershell
cd backend
npm run service:start
```

Stop it:

```powershell
npm run service:stop
```

Open:

```text
http://127.0.0.1:3000
```

## Manual Setup

1. Install dependencies:

```powershell
cd backend
npm install
```

2. Create the environment file:

```powershell
Copy-Item .env.example .env
```

3. Start a PostgreSQL database.

With Docker:

```powershell
docker compose up -d postgres
```

Without Docker, create a local PostgreSQL database named `sunset_health`, then match `.env` to your local username and password.

4. Start the NestJS API:

```powershell
npm run start:dev
```

Then open:

```text
http://127.0.0.1:3000
```

The frontend is served by the NestJS app, and API routes are under:

```text
http://127.0.0.1:3000/api
```

## Default Account

```text
email: admin@yian.local
password: admin123
role: admin
```

The first startup seeds demo data for residents, care tasks, alerts, camera streams, family feedback, and standard scores.

## Switch To MySQL

Start MySQL:

```powershell
docker compose --profile mysql up -d mysql
```

Then update `.env`:

```text
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=sunset
DB_PASSWORD=sunset
DB_DATABASE=sunset_health
```

## Main API

```text
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
GET  /api/dashboard/data
GET  /api/residents
GET  /api/care-tasks
GET  /api/alerts
GET  /api/cameras
```

## Production Notes

For production, set `DB_SYNC=false`, use migrations, replace `JWT_SECRET`, and use a managed PostgreSQL/MySQL instance with backups enabled.
