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

## Local Pilot Accounts

```text
email: superadmin@yian.local
password: admin123
role: super_admin
```

The first startup seeds six local pilot roles and 30 synthetic residents with related tasks, alerts, devices, and camera ledgers. These credentials are local trial data only and must be replaced before a real deployment.

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
GET  /api/auth/me
GET  /api/dashboard/data
GET  /api/residents
GET  /api/care-tasks
GET  /api/alerts
GET  /api/cameras
GET  /api/devices
GET  /api/audit-logs
```

## Production Notes

For production, set `DB_SYNC=false`, use migrations, replace `JWT_SECRET` and all pilot passwords, disable demo-account display, add HTTPS and gateway rate limiting, and use a managed PostgreSQL/MySQL instance with tested backups.

The complete local deployment, backup, acceptance, training, privacy, and demo instructions are under `docs/delivery/`.
