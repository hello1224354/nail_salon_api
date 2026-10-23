# Operations

This guide covers the runtime jobs and maintenance interfaces included in the repository. Deployment status, schedules and backup policies are properties of the hosting environment and must be verified there.

## Startup and health

[server.ts](../src/server.ts) initializes the database, checks pending migrations in production, starts the notification and booking workers, and then listens for HTTP requests. Shutdown stops the worker timers, closes the server and database, with a ten-second shutdown deadline.

`GET /health` returns `{"status":"ok"}` without making a fresh database query. Combine process health with database-backed reads, worker logs and application checks when assessing service availability.

Use the response `X-Request-Id`, timestamp, route and status to correlate a failure. Do not record passwords, OTP values, bearer tokens, refresh cookies or unnecessary customer details in incident reports.

## Notification outbox

[notification-outbox.service.ts](../src/modules/appointments/notification-outbox.service.ts) inserts one message per distinct administrator email address inside the booking transaction. If no administrator recipient is available, it logs a warning and does not enqueue a message.

The delivery worker runs immediately and every 60 seconds. Each pass selects up to 20 due messages in creation order. An atomic conditional update claims each message; claims older than five minutes can be reclaimed. Delivery failures return the message to `pending`, increment attempts and schedule exponential retry from one minute up to one hour. There is no terminal retry-count cutoff in this worker.

Delivery is at least once. If a provider accepts an email but the application cannot record success, a retry can send a duplicate. A successful booking response means the transaction committed, not that an email reached its recipient.

Monitor pending backlog age, repeated `last_error` values, stale processing claims and provider delivery logs. Resend is selected whenever its key is configured; Gmail is used only when the key is absent. Do not delete pending/processing rows to clear delivery errors.

## Booking operations worker

[booking-operations.worker.ts](../src/modules/appointments/booking-operations.worker.ts) runs immediately and every 30 seconds. It expires transfer requests and processes up to 100 overdue appointments per pass.

Pending or confirmed appointments become `no_show` once their scheduled start is at least 15 minutes in the past. Each appointment is locked and rechecked before mutation. The worker releases the relevant physical reservations while avoiding physical slots owned by unrelated work of accepted transfer recipients. Reconciliation does not depend on a browser remaining open.

See [Booking](BOOKING.md) for the distinction between physical reservations, transfer holds and individual work progress. These workers require a running API process; delayed ticks can delay reconciliation.

## Retention cleanup

[retention-cleanup.ts](../src/jobs/retention-cleanup.ts) is a separate destructive maintenance command. It is not scheduled by `server.ts`.

| Records | Deletion condition |
| --- | --- |
| `audit_logs` | `created_at` older than 90 days |
| Password reset, login MFA, registration email and password change challenges | `expires_at` or `consumed_at` older than 7 days |
| Refresh sessions and trusted login devices | `expires_at` or `revoked_at` older than 30 days |
| `notification_outbox` | Status `sent` and `sent_at` older than 30 days |

The thresholds apply to the timestamps themselves: an expired challenge is retained until its expiry is more than seven days old. Pending/processing outbox messages and booking/walk-in history are not purged by this job. All deletes run in one transaction, with rollback on failure and affected-row counts logged on success.

Build the API, confirm the intended database and retention policy, then invoke the job through an authorized maintenance environment. It reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` directly from process environment; **all five are required**. It does not import the normal dotenv configuration.

```bash
# With database variables already exported by the maintenance environment:
node dist/jobs/retention-cleanup.js
```

For a local Node.js 22+ environment with all five values in `.env`:

```bash
node --env-file=.env dist/jobs/retention-cleanup.js
```

Configure an external scheduler if recurring cleanup is required, and monitor exit status and deletion counts. The repository does not establish whether a hosted schedule exists.

## Investigation guide

| Symptom | Relevant evidence |
| --- | --- |
| API cannot start | Database connection, environment validation, compiled migration files and pending migration status |
| Availability is empty | Branch opening hours, bookable service durations, staff shifts, physical slots and active transfer holds |
| Booking returns conflict | Specific error code, requested time/party size, competing allocations and pending-booking limit |
| Work start/completion is rejected | Appointment state, employee assignment, individual progress and early-start confirmation |
| Transfer fails | Sender/recipient, branch, expiry, schedule snapshot and recipient-only acceptance rule |
| OTP is missing | Selected provider configuration, sender, send errors and provider delivery logs |
| Refresh/logout returns `UNTRUSTED_ORIGIN` | Exact origin allowlist, frontend origin and HTTPS configuration |
| Refresh returns `REFRESH_RACE` | Concurrent refresh attempts and the client's single-flight/retry behavior |
| Website serves an older version | Frontend deployment SHA, canonical domain assignment and API compatibility |
| Database grows unexpectedly | Media bytes, outbox backlog, retention execution and actual backup/storage usage |

Revenue summaries use completion time for completed online appointments and service time for walk-ins. Traffic metrics count browser-tab session IDs; they are not unique-person or page-view counts. Use these definitions when investigating reporting differences.

## Backup and recovery

Back up schema, application data, migration history and full media BLOBs. Keep encrypted recoverable copies outside the running database service, and test restoration into an isolated environment. Verify booking/assignment relationships, account/session expectations and image retrieval after a restore.

Before migration or cutover, establish the recovery point, acceptable data loss and application/schema compatibility. Restoring an older snapshot over an active service can discard newer bookings. Coordinate writes and recovery explicitly; an application rollback alone cannot undo database changes.

See [Deployment](DEPLOYMENT.md), [Database](DATABASE.md) and [Media storage](MEDIA-STORAGE.md).
