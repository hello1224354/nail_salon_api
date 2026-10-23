# Deployment and rollback

The project uses separate frontend, API and database services. The documented hosting arrangement is Next.js on Vercel and Express/MySQL on Railway. This guide describes source-level deployment requirements; it does not certify dashboard settings, live database contents or the currently deployed commit.

## Service boundaries

| Component | Build / start | Configuration |
| --- | --- | --- |
| Next.js frontend | From `frontend/`: `npm ci`, `npm run build`, `npm run start` where a standalone server is needed | `NEXT_PUBLIC_API_BASE_URL` before build |
| Express API | From root: `npm ci`, `npm run build`, `npm run start` | Backend variables in [Setup](SETUP.md) |
| MySQL | Existing compatible schema and migration history | Credentials available only to backend/maintenance processes |

The canonical website origin in [site-url.ts](../frontend/src/lib/site-url.ts) is `https://serpentenailroom.site`. [next.config.ts](../frontend/next.config.ts) permanently redirects requests with host `nail-salon-web-v2.vercel.app` to that origin. Domain aliases, DNS and deployment assignments must be configured in the hosting environment.

Next.js proxies `/api/:path*` to the origin of `NEXT_PUBLIC_API_BASE_URL`. Set the real backend URL before building; an absent/invalid rewrite value falls back to localhost. `/health` is a direct API endpoint, outside that rewrite.

## Prepare a release

1. Review the source diff and run the relevant [development checks](CONTRIBUTING.md). Four focused backend test files are included, but no GitHub Actions workflow is supplied.
2. Confirm the frontend/API versions are compatible and record the intended commit SHA for both deployments.
3. For database changes, verify the target schema, applied migration history, a recoverable backup and the migration's data/rollback behavior on an isolated compatible database.
4. Build the backend before inspecting or executing migrations, because the scripts load `dist/config/database.js`.
5. Configure a release/pre-deploy step to apply reviewed migrations before starting the production API. Confirm the hosting platform actually runs it; the repository alone does not establish that setting.

```bash
# API release environment, with the intended database configuration
npm ci
npm run build
npm run migration:show
npm run migration:run
npm run start
```

[server.ts](../src/server.ts) initializes MySQL and refuses production startup while migrations are pending. Production forces `DB_SYNCHRONIZE=false` and `DB_LOGGING=false`.

The two supplied migrations alter existing tables; they do not create a complete schema. Provision a new database from a compatible, reviewed schema/data process or an authorized snapshot. See [Database](DATABASE.md) before treating migration commands as environment bootstrap instructions.

## Production configuration

- Set `NODE_ENV=production`, all five `DB_*` connection values, `JWT_SECRET` and `CORS_ORIGIN`.
- Set `CORS_ORIGIN` to the exact frontend origin. Add other authorized origins explicitly with `CORS_EXTRA_ORIGINS`; this also affects refresh/logout origin checks.
- Match `TRUST_PROXY_HOPS` to the actual proxy chain. It affects client IP interpretation and therefore rate-limit behavior.
- Use HTTPS for frontend and API access. Production authentication cookies carry `Secure`.
- Configure Resend with a valid sender, or the complete Gmail OAuth2 configuration when no Resend key is present. Resend errors do not trigger automatic provider failover.
- Keep database credentials, JWT secrets and email credentials server-side. `NEXT_PUBLIC_API_BASE_URL` is public and must contain no secrets.
- Include `media_files` binary data in database capacity planning and backups. Image storage does not require an additional object-store service.

Both background workers run inside the API process. An always-running API service is needed for timely notification delivery and booking reconciliation. The separate retention job needs an external schedule; it is not started by the API. HTTP rate-limit counters use process-local storage, so multiple replicas do not share a single counter. See [Operations](OPERATIONS.md) and [Authentication](AUTH-SECURITY.md).

## Verify the release

Check the deployed SHA and runtime logs for each service, then verify the canonical frontend domain and direct API `/health`. Health confirms a responding process; it does not issue a live database query or verify email delivery.

Use authorized test accounts and synthetic data for a focused smoke test: load the catalog, finish login/refresh/logout, query availability, create an appointment, perform the relevant staff/admin workflow and inspect notification delivery. For media changes, also upload/read/reference an image and confirm referenced-image deletion is rejected. Select checks that exercise the release's affected behavior.

The [product tour](DEMO.md) supplies the relevant routes. A hosting deployment marked successful is not evidence that these flows passed.

## Rollback

Restore a frontend or API version compatible with the current database and the other application component. Reverting an application deployment does not revert database writes or migrations.

The duration migration intentionally has a no-op down method; the assistance migration's down method removes columns. Assess these effects before any database rollback. A historical backup can omit bookings recorded since it was taken, so restoration requires an explicit recovery/cutover plan rather than simply overwriting a live database.

Record source SHA, deployment identifiers, migration state, verification results and cutover time for each release. Keep the recovery procedure and credentials in the appropriate operational system, not in public documentation.
