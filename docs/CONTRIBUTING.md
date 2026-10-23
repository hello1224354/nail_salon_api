# Contributing

Serpente Nail Room includes an Express/TypeScript API, a Next.js frontend and a MySQL database. Start with [Setup](SETUP.md), [Architecture](ARCHITECTURE.md) and the domain documentation relevant to the change.

## Change workflow

1. Create a focused feature, fix or documentation branch from the current `main`.
2. Define the affected behavior and inspect its API, service, persistence and UI boundaries.
3. Implement the change within that scope. Update request validation, frontend types and public documentation when their contracts change.
4. Run applicable checks and record the commands and results in the pull request. Distinguish source review from executed tests and live-environment verification.
5. Review the diff for unrelated changes, secrets, customer data and generated artifacts before requesting review.
6. After an approved merge, follow [Deployment](DEPLOYMENT.md) for release verification and rollback planning.

## Code organization

- Routes select middleware and controllers; DTO helpers validate request inputs.
- Services enforce business rules, ownership and transaction boundaries. Client-side role checks do not replace server authorization.
- Entity classes define the TypeORM model; `src/migrations/` contains incremental database changes.
- `frontend/src/lib/api.ts` holds shared API interfaces and request helpers; `auth.ts` owns in-memory authentication state.
- Pages and components live in `frontend/src/app` and `frontend/src/components`.

## Automated checks

Install dependencies with `npm ci` separately at the root and in `frontend/`. Run backend checks from the repository root:

```bash
npm run typecheck
npm run build
node --import tsx --test tests/*.test.ts
```

The test command uses Node's test runner with the installed `tsx` loader. There is no `npm test` script. Existing tests cover:

| Test file | Focus |
| --- | --- |
| [appointment-charge.test.ts](../tests/appointment-charge.test.ts) | Party charges, actual-price overrides and additional work |
| [appointment-work-time-policy.test.ts](../tests/appointment-work-time-policy.test.ts) | Early start/completion timing policy |
| [booking-service-ownership.test.ts](../tests/booking-service-ownership.test.ts) | Primary/helper service ownership |
| [uuid-validation.test.ts](../tests/uuid-validation.test.ts) | UUID parameter validation |

Frontend checks, from `frontend/`:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

No GitHub Actions workflow is included. These commands are verification steps for contributors, not a statement that CI or a particular release has passed. The focused unit tests do not establish database locking, integration or browser-flow correctness.

For documentation-only changes, check factual claims against the relevant implementation, resolve relative links, verify route/command examples and review the final changed-file list. Application builds are not a substitute for those checks.

## Domain verification

Use isolated data and authorized accounts for behavior that requires the database, browser or email provider. Select scenarios relevant to the change:

- Scheduling: branch/staff hours, party allocation, occupied slots, parallel booking attempts and transaction rollback.
- Work operations: per-worker progress, helper service ownership, transfers, no-shows and final charges.
- Authentication: untrusted/trusted browser login, OTP expiry/attempts, refresh rotation, logout and password-change invalidation.
- Media: accepted formats/size, binary retrieval and reference-aware deletion.
- UI: API errors, role access, relevant pagination, business-time display and responsive forms.

Preserve backend staff allocation for customer bookings, 15-minute reservation uniqueness and the normal booking interval `[start_time, end_time)` without an extra buffer. Transfer overlap tolerance is a separate explicit rule; see [Booking](BOOKING.md).

## Database changes

The supplied migrations are incremental, not a complete schema baseline. Generate/review migrations against a compatible isolated schema with synchronization disabled; never rely on production `synchronize`.

The root `migration:generate` script wraps the TypeORM CLI. A generation command names an output path and supplies the source data source, for example:

```bash
npm run migration:generate -- src/migrations/DescribeChange -d src/config/database.ts
```

Review generated SQL and data effects before use. Build before running `migration:show` or `migration:run`, because those scripts target `dist/config/database.js`. Test the migration and its rollback/forward-recovery plan on an isolated compatible database, and back up the release target. Do not rewrite already applied migration history.

## Pull request notes

Explain the concrete behavior changed, affected contracts, validation performed and any remaining verification limits. Include migration prerequisites and deployment ordering when relevant. Public documentation should describe the product and implementation for an unfamiliar reader; keep credentials, personal notes and unverified production claims out of the repository.
