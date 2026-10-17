# Engineering case study — Serpente Nail Room

[Live application](https://serpentenailroom.site/) · [Product tour](DEMO.md) · [Architecture](ARCHITECTURE.md) · [Repository README](../README.md)

## Product context and technical goal

The application supports a nail salon where customers book services at a branch without selecting an employee. The backend must account for multi-service duration, party size, a limited staff pool, concurrent requests and administrative state transitions. A customer should see available slots before selecting a booking.

The scope also covers a public service catalog, authenticated customer history and a role-protected administrative dashboard.

**Stack:** Next.js 16 + React 19 + TypeScript frontend; Node/Express 5 API; MySQL 8 + TypeORM; JWT/refresh sessions; Resend/Gmail sender; transactional notification outbox; Vercel/Railway deployment.

## Concurrency-safe slot reservation

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

## Atomic group bookings

For a party of N, all assigned employees must be free at the *same start time* for the *full duration* of selected services. A single UUID `booking_group_id` links N appointment rows with per-staff assignment, and service prices/durations are snapshotted per appointment.

**Server-side staff assignment:** The booking contract allows customers to select available start times rather than employees. The server determines eligible staff, preventing the client from bypassing staff eligibility and availability checks.

**Constraint:** Appointments can overlap across **different** employees; the forbidden case is overlapping reservations for the **same** employee.

**Trade-off:** The group ID must be used to count pending *bookings*, while single appointment IDs remain useful for staff-specific lifecycle management.

## Authentication and account isolation

**Threat model:** Short-lived access JWTs protect against unlimited lifetime of a leaked credential, but compromise during that lifetime remains possible; therefore access token lifetime alone is insufficient. Refresh tokens require rotation and server-side session state.

- `refresh_sessions` stores hashed refresh proofs; a successful refresh invalidates the old token and issues a new one.
- Reuse detection can revoke a refresh-token family (with a narrow race-handling policy for near-simultaneous legitimate requests).
- Admin/customer OTP challenge is emailed when an account logs in on an untrusted browser.
- A trusted-browser token is bound to user identity, user-agent fingerprint, role, token version and expiration.
- Separate per-account cookie keys avoid logging into B overwriting A's remembered-browser state.
- Server-side RBAC and resource ownership checks protect appointment records. A foreign key alone is **not** authorization.

**Source:** [users controller](../src/modules/users/users.controller.ts), [session service](../src/modules/users/auth-session.service.ts), [trusted-device service](../src/modules/users/trusted-login-device.service.ts), [security docs](AUTH-SECURITY.md).

## Booking references and administrative search

Customers receive an easy-to-read code: the first 8 hexadecimal characters of the booking group UUID (uppercase). Admins can search by this code, date range, branch and status using database-side filters; results are paginated rather than loading all appointments into the browser.

**Trade-off:** An eight-character UUID prefix provides a compact lookup key but is not guaranteed globally unique and is not an authentication credential. The search results include the corresponding booking details.

**Source:** [booking UI](../frontend/src/components/booking/BookingForm.tsx), [admin UI](../frontend/src/components/admin/AdminDashboard.tsx), [API](API.md).

## Email delivery and transaction boundaries

One message per unique ADMIN email is enqueued in `notification_outbox` **within the booking transaction**. The API commits appointments and outbox messages atomically; after commit, an independent worker delivers messages using Resend (when configured) or Gmail OAuth fallback. Delivery failures are retried with exponential backoff, so email outages do not invalidate reservations.

**Reliability boundary:** This provides persistent **at-least-once** delivery, not exactly-once email delivery: a worker crash after provider acceptance but before status persistence can lead to a duplicate. The worker also reclaims stale processing messages.

**Source:** [notification outbox service](../src/modules/appointments/notification-outbox.service.ts), [notification entity](../src/modules/appointments/notification-outbox.entity.ts).

## Deployment

- Live frontend: [Vercel](https://serpentenailroom.site/).
- API: [Railway health endpoint](https://api-production-e911.up.railway.app/health).
- Deployments are managed through Vercel and Railway; GitHub Actions builds both applications and runs unit tests from `tests/`.
- References: [deployment guide](DEPLOYMENT.md), [operations guide](OPERATIONS.md).

## Current scope and limitations

The booking engine uses fixed branch-wide bookable hours and configurable **recurring daily staff working hours**, but not date-specific shift rosters. A payment gateway is not part of the application. Booking notifications are persisted in an outbox and retried, with at-least-once rather than exactly-once delivery semantics.

Unit tests cover selected booking, DTO and validation helpers in `tests/`; there is not yet comprehensive integration/E2E coverage. Centralized production alerting is not implemented. Historical database migrations are absent from the current source; provisioning a fresh production-equivalent database requires a verified backup until a new baseline is established.

Further implementation details are available in the [booking specification](BOOKING.md), [authentication and security](AUTH-SECURITY.md) and [API reference](API.md).
