# Engineering case study

## Scheduling problem

A salon booking request combines service duration, branch hours, party size and a finite employee roster. Availability can change between displaying a time and submitting a booking. Group bookings must also avoid partial allocation and preserve each employee's work ownership.

Serpente Nail Room uses a Next.js/React frontend and an Express/TypeScript API with MySQL and TypeORM. The following decisions describe the implementation rather than benchmark results or claims about production scale.

## Transactional allocation

A read-then-insert sequence cannot safely reserve capacity when two requests observe the same free interval. The booking service opens a `READ COMMITTED` transaction, locks the customer row for the pending-booking limit, then locks a per-branch allocation cursor. It checks working hours and reserves each employee's required 15-minute intervals.

The primary key `(staff_id, slot_start)` rejects duplicate physical reservations. A conflict can cause allocation to try another employee; failure to allocate the whole party rolls back the booking. The cursor lock coordinates workload ranking, while the database key independently enforces reservation uniqueness.

**Trade-off:** discrete slots add rows and reservation-release logic. The branch cursor also serializes allocation within a branch; this design is not a claim of unlimited write throughput.

Sources: [booking service](../src/modules/appointments/appointments.service.ts), [slot entity](../src/modules/appointments/staff-booking-slots.entity.ts).

## Workload-aware selection

Automatic assignment ranks same-branch employees by a weighted score: 60% daily assigned minutes relative to shift length and 40% assigned minutes in the trailing 14-day window relative to 14 shift lengths. Scores within 0.05 of the minimum use a rotating roster tie-break.

This balances recorded workload; it does not model employee specializations, preferences or measured service quality. The chosen employee must still cover the entire interval and have capacity.

Source: [staff allocation](../src/modules/appointments/staff-allocation.ts).

## One booking, multiple workers

A customer submission creates one appointment with `party_size`, one primary assignment per guest and shared service snapshots. Per-worker timestamps allow employees to start and complete separately; the booking is completed only when every assignment is complete.

Service assistance can add one helper for one booked service at a guest position without increasing party size. Price ownership moves with delegated work. Transfers replace an unstarted primary assignment only after the recipient personally accepts.

**Trade-off:** a single booking simplifies customer history and booking counts, but work completion and charging must account for assignments rather than multiplying every joined database row. Helpers must not be counted as extra guests.

Sources: [assignment model](../src/modules/appointments/appointment-staff-assignment.entity.ts), [assistance](../src/modules/appointments/booking-service-assistance.service.ts), [transfers](../src/modules/appointments/appointment-transfers.service.ts).

## Physical reservations and logical holds

Normal bookings and service helpers use physical reservation slots. Transfer requests use logical intervals, expire after three minutes, and allow at most ten minutes of overlap with each checked competing booking or hold. Accepted transfers retain logical protection rather than inserting conflicting physical slots.

Availability and allocation therefore consider both physical slots and active transfer holds. Treating either representation alone as all occupied capacity would misdescribe the system.

See [Booking](BOOKING.md) for the exact transfer scope and lifecycle.

## Account isolation

The browser receives short-lived access JWTs and a refresh cookie. Refresh proofs are hashed in the database, rotated on use and grouped into revocable families. Reuse detection revokes a family, with a narrow same-fingerprint race response for near-simultaneous legitimate refreshes.

All roles use OTP when the browser is not trusted. Per-account trusted-cookie names prevent one account's proof from overwriting another's. Role gates and resource ownership are separate checks; knowing an appointment identifier does not grant access.

Sources: [session service](../src/modules/users/auth-session.service.ts), [trusted-device logic](../src/modules/users/trusted-login-device.logic.ts), [authorization](AUTH-SECURITY.md).

## Commit first, deliver email separately

The booking transaction inserts notification messages alongside the appointment. After commit, a worker claims messages and sends them through Resend or the configured Gmail path. Failed sends receive exponential-backoff retries; stale claims can be reclaimed.

This is at-least-once delivery. A provider may accept a message before the worker persists success, so a later retry can duplicate delivery. Email failure cannot roll back a booking that has already committed.

Source: [notification outbox](../src/modules/appointments/notification-outbox.service.ts).

## Validation and scope

Four focused unit-test files cover charge calculation, work-time rules, service ownership and UUID validation. They do not establish integration, concurrency or end-to-end correctness. Development commands are documented in [Contributing](CONTRIBUTING.md).

The repository includes incremental migrations but no complete baseline or seed command. Other boundaries include recurring daily staff hours, database-backed image storage and no online payment integration. These constraints should guide environment setup and evaluation of the project.
