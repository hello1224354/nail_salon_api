# Serpente Nail Room

A full-stack nail salon application for appointment booking, staff coordination, and day-to-day salon operations.

> **Deployment status (October 2026):** This repository is the **legacy full-stack implementation**. Its Vercel production URL is [nail-salon-web-v2.vercel.app](https://nail-salon-web-v2.vercel.app/). The official salon domain [serpentenailroom.site](https://serpentenailroom.site/) now serves the **standalone frontend-only** repository [serpente-web](https://github.com/hello1224354/serpente-web); booking on that public site is handled by [KiotViet](https://booksalon.kiotviet.vn/serpentenailroom). This repository's booking and admin features remain separate from KiotViet and should not be used for live customer reservations without an explicit operating decision.

[Legacy full-stack website](https://nail-salon-web-v2.vercel.app/) · [Product tour](docs/DEMO.md) · [Technical documentation](docs/README.md) · [Engineering case study](docs/PORTFOLIO.md)

## What the application does

Customers browse services, select a branch, party size and available time, and submit a booking without choosing an employee. The API allocates staff, reserves their time, and creates one appointment for the entire party. Staff and administrators manage the work through role-restricted interfaces.

| Area | Capabilities |
| --- | --- |
| Customer experience | Service catalog, available-time lookup, individual/group booking, appointment history, email-verified accounts |
| Staff workspace | Assigned bookings, per-worker start/completion, actual charges and additional services, reception lookup, transfer requests, optional service assistance, walk-in records |
| Administration | Appointment search and editing, staff and branch management, service categories, promotions, media library, daily/monthly/lifetime summaries and visit statistics |
| Account security | Email OTP for all roles on unrecognized browsers, account-scoped browser trust, JWT access tokens, rotating refresh sessions and server-side authorization |

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | MySQL 8, TypeORM |
| Email | Resend; Gmail OAuth2 when Resend is not configured |
| Hosting | Vercel frontend and Railway API/MySQL |

Browser requests use the frontend's same-origin `/api` rewrite. The API owns validation, authorization, scheduling and persistence. Images uploaded through the admin interface are stored in MySQL.

## Engineering highlights

- **Transactional group bookings.** One appointment holds the party, service snapshots and primary employee assignments. The appointment, reservations and notification outbox entries are committed together.
- **Concurrent staff allocation.** A per-branch allocation cursor serializes workload ranking. A composite primary key `(staff_id, slot_start)` independently prevents duplicate ordinary reservations at 15-minute boundaries.
- **Workload-aware assignment.** Candidate employees must belong to the branch and cover the full service interval. A weighted daily/14-day workload score and rotating tie-break select staff; there is no skill-specialization model.
- **Per-worker operations.** Each assignment tracks its own work progress. Additional service helpers and accepted transfers have explicit ownership and reservation rules.
- **Durable notifications.** A database outbox separates booking commit from email delivery and retries failed messages. Delivery is at least once; duplicates remain possible after an ambiguous provider outcome.

See [booking rules](docs/BOOKING.md), [database design](docs/DATABASE.md) and [authentication](docs/AUTH-SECURITY.md) for the implementation boundaries.

## Run locally

Use Node.js 22 or newer, npm, and Docker Compose v2. The repository does not pin a Node engine version; Node.js 22+ is the recommended development baseline.

```bash
git clone https://github.com/hello1224354/nail_salon_api.git
cd nail_salon_api
cp .env.example .env
```

Set `DB_PASSWORD` and a strong `JWT_SECRET` in `.env`, then run:

```bash
docker compose up -d
npm ci
npm run dev
```

In another terminal:

```bash
cd nail_salon_api/frontend
cp .env.example .env.local
npm ci
npm run dev
```

Frontend: `http://localhost:3001`. API: `http://localhost:3000`. Health: `http://localhost:3000/health`.

Local entity synchronization can create tables, but it does not seed accounts, branches, services or website content. Email delivery must be configured for OTP flows. The two incremental migrations in the repository do not create a complete database from scratch. Follow [setup](docs/SETUP.md) for data prerequisites and configuration before trying the booking flow.

## Development checks

Backend, from the repository root:

```bash
npm run typecheck
npm run build
node --import tsx --test tests/*.test.ts
```

Frontend, from `frontend/`:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

The four test files cover charge calculation, work-time policy, service ownership and UUID validation. They are not an end-to-end or concurrency test suite. No GitHub Actions workflow is included. See [contributing](docs/CONTRIBUTING.md) for review and validation guidance.

## Project scope

The system records service charges but does not integrate an online payment gateway. Staff hours repeat daily rather than using date-specific shift rosters. Database provisioning requires attention because a complete baseline migration and seed command are not included.

[API reference](docs/API.md) · [Frontend](docs/FRONTEND.md) · [Deployment](docs/DEPLOYMENT.md) · [Operations](docs/OPERATIONS.md)
