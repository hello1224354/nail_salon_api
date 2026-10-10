# Serpente Nail Room — QA release gate

## Principles

- Production (https://serpentenailroom.site) is not a bulk-testing environment.
- Staging must have an independent frontend, backend, **separate MySQL** and test-only mail configuration; never point its app to the production database.
- All *business test data* (staff, services, appointments, offers, media) must be created/modified/deleted **only through the real website ADMIN/CUSTOMER interface**, not by seed scripts, SQL, direct API calls or devtools.
- Label temporary accounts and business records `QA-TEST`; record appointment IDs and staff emails in the run report.
- After each operation, refresh and verify the resulting persisted state. Clicking a control is not itself PASS.
- Preserve the browser's signed-in session; do not click Logout during QA.

## P0 acceptance scenarios (all must PASS before release)

| ID | Action (using browser UI) | Expected |
|---|---|---|
| AUTH01 | CUSTOMER registers, confirms account and signs in | Correct session/role and OTP behavior |
| AUTH02 | CUSTOMER opens /admin and protected actions | No ADMIN access |
| AUTH03 | Expire or invalidate test account session | Safe login redirect; no exposed data |
| BK01 | Select branch and service, 1 person | Valid future slots only; price/duration correct |
| BK02 | Book 1 person | One appointment, one eligible staff |
| BK03 | Book 2 people | One appointment ID, two **distinct** eligible staff |
| BK04 | Book 5 people | One appointment ID, five **distinct** eligible staff |
| BK05 | Book 6 people when capacity permits | One appointment ID, six distinct eligible staff |
| BK06 | Attempt group above the configured maximum | UI blocks; no appointment created |
| BK07 | Attempt time with insufficient simultaneous staff | Slot unavailable; no partial assignment |
| BK08 | Book adjacent non-overlapping intervals | No extra buffer; end-exclusive time |
| BK09 | Refresh /appointments after booking | Correct status/service/party size; exactly one card per ID |
| BK10 | CUSTOMER views another account's appointments | Not exposed |
| BK11 | Click submit twice with slow network | No accidental duplicate booking |
| AD01 | ADMIN search appointment by exact code | Exactly one matching record |
| AD02 | ADMIN reschedule group to free time | Same ID; all staff assignment updated atomically |
| AD03 | ADMIN select one member of group | Selected staff plus automatically assigned remaining staff |
| AD04 | ADMIN leave staff unspecified | Automatic assignment for full group |
| AD05 | ADMIN change pending → confirmed | Persisted status on reload |
| AD06 | ADMIN cancel group | All member reservations released |
| AD07 | ADMIN delete cancelled QA appointment | Removed from list without touching other appointments |
| ST01 | ADMIN create 6 QA staff with suitable working hours | Six verified distinct staff rows |
| ST02 | ADMIN edit QA staff hours to a conflicting shift | Rejected if future booking conflicts |
| ST03 | ADMIN delete QA staff using explicit **in-page** confirmation | Only targeted QA staff removed; cancel button preserves it |

## P1 coverage

Service, staff, branch, offer, Hot Trend and media CRUD; required-field and duplicate checks; session and password security; mobile/tablet/desktop usability; keyboard and screen-reader access; network interruptions; pagination/search/filter correctness.

## Non-UI concurrency verification (separate CI check)

The MySQL 8 integration suite must exercise true concurrent transactions to enforce unique `(staff_id, slot_start)`, half-open `[start_time, end_time)`, zero buffer and all-or-nothing assignment for group bookings. Human browser clicking alone cannot establish concurrency safety.

## Gate & evidence

- Record for every case: PASS/FAIL/BLOCKED, exact steps and observed result, environment, timestamp, screenshot/video, appointment/staff identifiers.
- **No release with any P0 failure or missing result**; no high-severity defect open.
- Run automated backend/frontend/integration tests and preview build; then UI regression on isolated staging and read-only production smoke test.
- Clean up bookings (cancel before delete) then QA staff; re-open lists to verify deletion. If cleanup fails, record unresolved QA names and block release.

## Observed production issues (2026-10-10)

- Booking groups of 2 and 5 were verified as one appointment each with 2 and 5 distinct assigned staff.
- UI allowed at most 6 people even though 7 staff existed. Confirm intended product rule.
- ADMIN staff deletion currently calls native `window.confirm`. TinyFish browser interaction did not complete that dialog, so deletion could not be verified. Prefer an in-page confirmation with explicit Cancel/Delete controls.
- QA bookings F70CC8EC and AB6476B2 were cancelled and deleted by the UI.
- QA-TEST STAFF 01–05 were still shown on the last cleanup attempt; QA-TEST STAFF 06 was absent, reason not established.

## Isolated staging deployed (2026-10-10)

- Frontend: https://serpente-nailroom-staging-web.vercel.app (Vercel project `serpente-nailroom-staging-web`, independent of the production project).
- API: https://api-qa-staging.up.railway.app (Railway project `serpente-nailroom-staging-qa`, environment `staging`).
- Database: separate MySQL 8.0 with a 500 MB persistent volume; uses a separate JWT secret. No production database or email/OAuth secrets were copied.
- Verified: frontend homepage, services, signed-out booking, admin login screen; staging API `/health` and branch listing via staging frontend's `/api` rewrite.
- **BLOCKED FOR AUTHENTICATED E2E:** no QA ADMIN login exists in the isolated database, and email registration/MFA has no staging-only mail provider. Obtain approval for a secure one-time staging ADMIN bootstrap (not via direct production API/SQL), then create all other test records through the actual web ADMIN UI.
- **BLOCKED PRODUCTION CLEANUP:** native `window.confirm` in staff deletion prevents UI agent from confirming. GitHub issue #77 tracks the in-page confirmation fix. Do not claim the QA staff have been deleted.
