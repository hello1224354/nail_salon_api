# Local setup and configuration

The repository contains an Express API at the root and a Next.js application in `frontend/`. Run them as separate processes against MySQL.

## Prerequisites

- Node.js 22+ and npm are the recommended development baseline; the repository does not declare a Node engine constraint.
- Docker Engine with Compose v2 for the supplied MySQL 8 development service, or a compatible MySQL instance.
- A configured email provider for registration, login OTP and password recovery.

## 1. Configure the database and API

```bash
git clone https://github.com/hello1224354/nail_salon_api.git
cd nail_salon_api
cp .env.example .env
```

Set `DB_PASSWORD` and a strong, environment-specific `JWT_SECRET`. For the supplied Compose service, use `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root` and `DB_NAME=nail_salon_db`. Compose reads the database name and root password from `.env`.

```bash
docker compose up -d
npm ci
npm run dev
```

The API listens on port 3000 by default. `GET http://localhost:3000/health` returns `{"status":"ok"}` once startup completes. It does not perform a fresh database query.

The [Compose file](../docker-compose.yml) does not declare a named database volume or a backup policy. Preserve needed data before recreating the development database; do not treat this file as a production persistence configuration.

## 2. Provision application data

Development defaults to `DB_SYNCHRONIZE=true`, allowing TypeORM to create/update entity tables. This does not create usable accounts, catalog records or website content. Production always disables synchronization.

A meaningful booking demonstration needs:

- A branch with parseable opening hours.
- Services belonging to that branch, with booking enabled and a non-null duration.
- STAFF accounts/profiles in the branch with recurring working hours covering the appointment.
- Customer accounts and an administrator provisioned through an authorized process.
- Salon content for the public site; trend creation expects `salon_content.id = 1`.

There is no complete baseline migration, seed command or public administrator bootstrap endpoint. Use a reviewed provisioning process or an authorized sanitized database snapshot. Public registration creates customer accounts; it is not an administrator provisioning mechanism. Avoid loading real customer data into a development environment.

The two migrations in [Database](DATABASE.md) are incremental changes to existing tables. Running `migration:run` against an empty database does not initialize the application. When using a compatible existing schema, inspect its migration history before applying changes; do not combine automatic synchronization and migration experiments against shared data.

## 3. Start the frontend

In another terminal, from the repository root:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` in `.env.local`. Open `http://localhost:3001`. Browser API calls use `/api/...`; Next.js rewrites them to the configured backend origin.

To serve production builds locally, first build each application. The frontend start script does not inherit the development port:

```bash
# Repository root
npm run build
npm run start
```

```bash
# frontend/
npm run build
npm run start -- -p 3001
```

## Backend environment reference

[env.ts](../src/config/env.ts) loads `.env` and validates these settings.

| Variable | Default / requirement | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development`; accepts `development` or `production` | Runtime mode |
| `PORT` | `3000` | API listen port |
| `TRUST_PROXY_HOPS` | `1`, range 0-5 | Number of trusted reverse-proxy hops |
| `CORS_ORIGIN` | Local `http://localhost:3001`; required in production | Primary trusted frontend origin |
| `CORS_EXTRA_ORIGINS` | Empty; optional comma-separated origins | Additional explicit trusted origins |
| `DB_HOST` | Local `localhost`; required in production | MySQL host |
| `DB_PORT` | Local `3306`; required in production | MySQL port |
| `DB_USER` | Local `root`; required in production | MySQL account |
| `DB_PASSWORD` | Required | MySQL password |
| `DB_NAME` | Local `nail_salon_db`; required in production | Database name |
| `DB_SYNCHRONIZE` | Development `true`; forced `false` in production | Entity schema synchronization |
| `DB_LOGGING` | Development `true`; forced `false` in production | TypeORM SQL logging |
| `JWT_SECRET` | Required | Signing and authentication key material |
| `JWT_EXPIRES_IN_SECONDS` | `600`, range 300-900 | Access-token lifetime |
| `REFRESH_SESSION_DAYS` | `7`, range 1-30 | Refresh-session lifetime; browser trust has an independent 30-day lifetime |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Optional pair | Preferred transactional email provider |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_FROM_EMAIL` | Optional complete set | Email provider when no Resend key is configured |
| `GOOGLE_MAPS_URL` | Optional | Salon map link |

Origin settings accept exact HTTP(S) origins, not wildcards, paths or URL credentials. The same allowlist protects session refresh/logout. Configure proxy hops for the actual deployment topology. Keep secrets out of version control.

The frontend example contains `NEXT_PUBLIC_API_BASE_URL`; set it explicitly before building. It identifies a public API location and must not contain credentials. The Next rewrite falls back to localhost if the value is missing/invalid, but other frontend configuration requires the variable, so the fallback is not a deployment configuration strategy.

## Email behavior

[email.service.ts](../src/modules/users/email.service.ts) selects Resend when `RESEND_API_KEY` is present and requires a sender. Gmail OAuth2 is selected only when that key is absent and all four Gmail settings are available. A Resend send failure does not automatically fall back to Gmail.

OTP email is sent synchronously. Booking notifications are committed to the database outbox and delivered asynchronously. Without a usable provider, OTP flows cannot complete; there is no development OTP bypass. Configure valid provider credentials and an authorized sender for the test environment.

## Commands and troubleshooting

Run development checks from [Contributing](CONTRIBUTING.md). Migration inspection/execution requires a backend build and the correct database configuration:

```bash
npm run build
npm run migration:show
# Apply reviewed pending migrations only to the intended compatible database:
npm run migration:run
```

| Symptom | Check |
| --- | --- |
| Missing environment variable or invalid range | Required values and bounds above |
| MySQL connection refused | Container readiness, port conflicts and database host/credentials |
| Production startup refuses pending migrations | Build output, target schema and migration history |
| Empty catalog or no available times | Initial data, branch hours, staff shifts and bookable service durations |
| OTP cannot be delivered | Selected provider, sender and server/provider logs |
| API fetch or session-origin error | Frontend API origin, rewrite, exact origin allowlist and HTTP/HTTPS consistency |

Continue with [Deployment](DEPLOYMENT.md) for hosted environments and [Operations](OPERATIONS.md) for runtime maintenance.
