# Serpente Nail Room — Engineering case study

[Live application](https://nail-salon-web-v2.vercel.app/) · [Repository README](../README.md) · [Source-level architecture](ARCHITECTURE.md) · [Screenshots](SCREENSHOTS.md)

## Product context and technical goal

The application supports a nail salon where customers book services at a branch without selecting an employee. The backend must account for multi-service duration, party size, a limited staff pool, concurrent requests and administrative state transitions. A customer should see available slots before selecting a booking.

The scope also covers a public service catalog, authenticated customer history and a role-protected administrative dashboard.

**Stack:** Next.js 16 + React 19 + TypeScript frontend; Node/Express 5 API; MySQL 8 + TypeORM; JWT/refresh sessions; Gmail OAuth2; GitHub Actions; Vercel/Railway deployment.

## Challenge 1 — Concurrency and inventory reservation

**Failure mode:** The sequence `SELECT open slots → INSERT appointment` is vulnerable to a race when two requests read the same free interval before either has written.

**Implemented approach:**

1. GET availability reads active appointments and calculates slots where enough staff are free.
2. On POST, backend opens a TypeORM transaction and locks the customer's database row to enforce the pending-booking-group limit consistently for that customer.
3. Server independently computes candidate staff, each required 15-minute slot in `[start, end)`, and attempts to reserve them.
4. Table `staff_booking_slots` uses composite primary key `(staff_id, slot_start)`. MySQL rejects a conflicting insert.
5. If a candidate staff conflicts, allocation can try another eligible staff. If the party cannot be fully assigned, the transaction rolls back without creating a partial group.
6. Upon success, the service stores appointments and service snapshots before commit.

```mermaid
sequenceDiagram
    participant A as Customer A
    participant B as Customer B
    participant API as Booking API
    participant DB as MySQL
    A->>API: POST booking at T
    B->>API: POST booking at T
    API->>DB: Transaction A: insert staff slot T
    API->>DB: Transaction B: insert same staff slot T
    DB-->>API: One insert commits; competing insert conflicts
    API-->>A: Success if staff reserved
    API-->>B: Retry another staff or return SLOT_UNAVAILABLE
```

**Trade-off:** Reserving fine-grained slots adds rows and requires releasing/rebuilding reservations when appointments change. This is more deliberate than simply maintaining a boolean `available` flag. The database uniqueness guarantee matters more than stale availability shown to users.

**Source:** [booking service](../src/modules/appointments/appointments.service.ts), [slot entity](../src/modules/appointments/staff-booking-slots.entity.ts), [booking docs](BOOKING.md).

**Verification:** GitHub Actions runs integration tests against an isolated MySQL 8 service with real migrations, concurrent calls to the booking service, assertions on persisted appointments/slot keys, atomic group bookings and rollback. This is a correctness regression suite, **not** a throughput benchmark; avoid claiming measured load capacity.

## Challenge 2 — Group booking and consistency

For a party of N, all assigned employees must be free at the *same start time* for the *full duration* of selected services. A single UUID `booking_group_id` links N appointment rows with per-staff assignment, and service prices/durations are snapshotted per appointment.

**Why not accept `staff_id` from the browser?** The user-facing contract deliberately restricts customers to selecting available start times. Server-side allocation prevents clients from selecting an unqualified/busy employee or circumventing availability calculations.

**Constraint:** Appointments can overlap across **different** employees; the forbidden case is overlapping reservations for the **same** employee.

**Trade-off:** The group ID must be used to count pending *bookings*, while single appointment IDs remain useful for staff-specific lifecycle management.

## Challenge 3 — Authentication and account isolation

**Threat model:** Short-lived access JWTs protect against unlimited lifetime of a leaked credential, but compromise during that lifetime remains possible; therefore access token lifetime alone is insufficient. Refresh tokens require rotation and server-side session state.

- `refresh_sessions` stores hashed refresh proofs; a successful refresh invalidates the old token and issues a new one.
- Reuse detection can revoke a refresh-token family (with a narrow race-handling policy for near-simultaneous legitimate requests).
- Admin/customer OTP challenge is emailed when an account logs in on an untrusted browser.
- A trusted-browser token is bound to user identity, user-agent fingerprint, role, token version and expiration.
- Separate per-account cookie keys avoid logging into B overwriting A's remembered-browser state.
- Server-side RBAC and resource ownership checks protect appointment records. A foreign key alone is **not** authorization.

**Source:** [users controller](../src/modules/users/users.controller.ts), [session service](../src/modules/users/auth-session.service.ts), [trusted-device service](../src/modules/users/trusted-login-device.service.ts), [security docs](AUTH-SECURITY.md).

## Challenge 4 — User-facing booking reference and admin search

Customers receive an easy-to-read code: the first 8 hexadecimal characters of the booking group UUID (uppercase). Admins can search by this code, date range, branch and status using database-side filters; results are paginated rather than loading all appointments into the browser.

**Trade-off:** A truncated UUID is a convenient lookup reference, **not** globally guaranteed unique and not an authentication secret. Admin should confirm booking details after searching.

**Source:** [booking UI](../frontend/src/components/booking/BookingForm.tsx), [admin UI](../frontend/src/components/admin/AdminDashboard.tsx), [API](API.md).

## Challenge 5 — Email integration and transaction boundaries

An email to configured ADMIN recipients is triggered **after** appointment transaction commit. The booking succeeds even when Gmail is unavailable, so a third-party failure does not invalidate the salon's reservation.

**Known limitation:** Notification is currently best-effort. Process termination or Gmail outage can lose a notification. For a stronger SLA, write an outbox record in the same DB transaction as the booking, then let a worker deliver with bounded retries, observability and a deduplication strategy.

**Source:** [notification service](../src/modules/appointments/booking-notification.service.ts).

## Production and quality signals

- Live frontend: [Vercel](https://nail-salon-web-v2.vercel.app/).
- API status: [Railway health endpoint](https://api-production-e911.up.railway.app/health).
- CI: backend typecheck + regression tests + compile + dependency audit; frontend typecheck + build + CSP check + audit; Docker/VPS config check.
- Deployment process: verify commit SHA against deployed Vercel/Railway revision; check database migrations, health, and authorized E2E actions.
- Engineering documentation: [root docs index](README.md), [deployment](DEPLOYMENT.md), [testing operations](TESTING-OPERATIONS.md).

### Current limitations / sensible next improvements

1. Browser E2E tests for OTP/login, booking and role-based admin workflows.
2. A transactional outbox/worker for guaranteed notification retries.
3. Error-code-specific UX instead of generic HTTP 409 messages; structured logging and production error alerts.
4. Mobile/desktop screenshot gallery and an optional short recorded demo with sanitized test data.
5. Dedicated stress tests with measured throughput and fault injection, separate from correctness-focused MySQL concurrency tests.

**No invented benchmarks:** No claims about production traffic, throughput, response-time percentiles or perfect availability are made without measurement. Code review and unit tests do not replace a full security audit.

## How to present this project in an interview

Use a short, verifiable walkthrough:

> This is a deployed appointment system built with Next.js, Express, and MySQL. I focus on its booking allocation and concurrency: customers select a time, while the backend assigns available staff and reserves 15-minute intervals inside a database transaction. A composite key prevents two transactions from reserving the same employee slot. I also worked with account security, refresh-token rotation, admin search, notifications and CI/CD. The documentation records trade-offs and remaining tests instead of claiming the application is perfect.

Use **only the parts you personally implemented and can explain** when describing individual contributions. Be ready to navigate to source and explain a real bug fix, relevant tests, and what happens on transaction rollback.

## Suggested recruiter demonstration (no sensitive credentials)

1. Public homepage and service catalog.
2. Booking UI layout: branch, services, party size, available time slots; do not submit a production booking just for demonstration.
3. Explain database key and booking transaction using the code links above.
4. Show anonymized successful booking confirmation and admin search flow using authorized **test data**, if available.
5. Point to GitHub CI and the exact tests it runs.
