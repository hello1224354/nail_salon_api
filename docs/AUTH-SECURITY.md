# Authentication and security

The API owns authentication and authorization. Frontend route guards improve navigation, but do not grant access to protected data.

## Roles and resource ownership

`users.role` is `customer`, `staff` or `admin`. [hasRoleAccess](../src/common/role-permissions.ts) implements route-level inheritance: STAFF can use CUSTOMER routes; ADMIN can use STAFF and CUSTOMER routes.

| Role | Typical access and restrictions |
| --- | --- |
| CUSTOMER | Make personal bookings and read own appointments; no appointment update/delete permission |
| STAFF | Customer capabilities plus assigned jobs, own work charges, reception lookup, transfer/assistance operations and own walk-ins |
| ADMIN | Administrative catalogs, appointment management, summaries and supported employee actions with an explicitly selected employee |

Services still enforce ownership. STAFF cannot impersonate another worker. ADMIN selects the relevant worker for supported work actions, but cannot accept or decline a transfer for its recipient. Staff reception lookup is limited to their branch and does not grant assignment ownership. See [API](API.md).

## Registration and login

Registration requests a verification code before creating a CUSTOMER account. The code-request endpoint returns a generic HTTP 202 response for registered and unregistered addresses with a minimum response delay and jitter to reduce account enumeration.

Login checks password credentials, then evaluates trusted-browser proof for **all three roles**. An untrusted browser receives HTTP 202 with `mfa_required`, `challenge_id`, `masked_email` and `expires_at`; `/api/users/login/mfa/verify` completes authentication. A trusted browser still requires the password.

Email challenges use six-digit codes, five-minute expiry and at most five attempts. Codes are HMAC-hashed with server-side key material, single-use and verified in the backend. Passwords are stored with bcrypt hashing. Password changes/resets invalidate relevant account sessions through token-version and revocation logic.

Sources: [users controller](../src/modules/users/users.controller.ts), [login challenge service](../src/modules/users/login-mfa.service.ts), [registration verification](../src/modules/users/registration-verification.service.ts).

## JWT and refresh sessions

- Access JWTs use HS256, issuer `nail-salon-api`, audience `nail-salon-web`, subject user ID, role, token version and `type=access`.
- Token life is configured by `JWT_EXPIRES_IN_SECONDS`: 300-900 seconds, default 600.
- The frontend keeps access tokens and current-user state in module memory, not persistent browser storage.
- Refresh proofs contain a session identifier and random secret; the database stores a SHA-256 hash.
- Refresh rotates to a replacement session in the same family. Detected reuse revokes that family. A same-fingerprint request within five seconds of rotation receives `REFRESH_RACE` rather than immediately revoking the family.
- Refresh lifetime is `REFRESH_SESSION_DAYS`: 1-30 days, default 7. Rotation retains the existing session expiry.
- Logout revokes the refresh family and clears the refresh cookie. Browser-trust proof remains separate.

Source: [session service](../src/modules/users/auth-session.service.ts).

## Cookies and trusted browsers

| Cookie | Development / production name | Scope |
| --- | --- | --- |
| Refresh | `ns_refresh` / `__Secure-ns_refresh` | `/api/users/session` |
| Browser trust | `ns_login_trust` / `__Secure-ns_login_trust`, with account suffix | `/api/users/login` |

Both are HttpOnly and SameSite=Lax, with Secure in production. `remember_me` controls persistent versus session refresh cookies. Browser trust has an independent 30-day lifetime.

Trust proof is bound to account identity, role, token version, user-agent hash and expiry. Cookie names contain a 32-character hash-derived account suffix, so multiple accounts do not overwrite one shared proof. The server stores hashed proofs; legacy shared-cookie fallback is supported. Successful trusted password login renews trust, while revocation or changed proof conditions require OTP again.

Sources: [refresh cookie](../src/modules/users/session-cookie.ts), [trusted-device service](../src/modules/users/trusted-login-device.service.ts), [cookie naming](../src/modules/users/trusted-login-device.logic.ts).

## Origins and browser protection

`CORS_ORIGIN` and optional comma-separated `CORS_EXTRA_ORIGINS` form an exact allowlist of HTTP(S) origins. Wildcards, paths, credentials, queries and fragments are rejected. Refresh/logout require a matching `Origin` header; an absent header is not trusted. CORS uses the same allowlist with credentials enabled.

Express disables its identifying header, applies request IDs, nosniff, a restrictive API CSP, referrer/permissions policy and production HSTS. JSON bodies are limited to 32 KB; binary media uploads use a separate 5 MiB parser. The Next proxy supplies a CSP nonce, and the layout renders dynamically to use request-specific values.

Sources: [trusted origins](../src/common/middleware/trusted-origins.ts), [API setup](../src/app.ts), [frontend proxy](../frontend/src/proxy.ts).

## Rate limits and audit checks

The following route-level limits are configured in [rate-limit.middleware.ts](../src/common/middleware/rate-limit.middleware.ts). They are independent of OTP attempt limits and database audit checks.

| Limiter | Requests/window | Key |
| --- | --- | --- |
| Login | 100 / 15 minutes; successful requests skipped | IP |
| Registration | 100 / hour | IP |
| MFA verification; password recovery | 100 / 15 minutes | IP |
| Refresh/logout | 100 / 5 minutes | IP |
| Account OTP | 100 / 15 minutes | Account, IP fallback |
| Sensitive account actions | 100 / 15 minutes; successful requests skipped | Account |
| Booking | 100 / 15 minutes | Account |
| Availability | 100 / minute | Account, IP fallback |
| Public reads | 120 / minute | IP |
| Authenticated reads | 120 / minute | Account, IP fallback |
| Media upload | 100 / hour | Account |

Only routes using a limiter receive that limiter's protection; it is not a global limit on every API endpoint. The default middleware store is process-local.

Login also checks persisted audit history: ten account failures in 30 minutes or five IP failures in 15 minutes block further attempts. OTP login sends are limited to five per account in 15 minutes. These checks can reject a request before the middleware allowance is exhausted.

Security events and supported admin work actions are audited; generic successful mutations have best-effort audit recording. Logs may contain identifiers and operational context and must be handled as restricted operational data. Do not commit passwords, tokens, cookies, OTPs, private logs or database dumps.

## Email and troubleshooting

Resend is selected when `RESEND_API_KEY` is configured and requires a valid `RESEND_FROM_EMAIL`. Gmail OAuth2 is used only when Resend is not selected, not automatically after a failed Resend request. Unavailable email delivery does not bypass OTP.

| Symptom | Check |
| --- | --- |
| Login returns 202 | Complete the OTP challenge |
| Repeated OTP prompts | Account-specific cookie, user-agent changes, expiry, revocation and proxy cookie handling |
| Refresh returns 401 | Cookie presence, expiry, token family and revocation |
| Refresh returns 409 `REFRESH_RACE` | Concurrent refresh coordination; the client has a retry path |
| Refresh/logout returns 403 | Exact Origin allowlist and frontend origin |
| Login returns 429 | Both middleware limits and persisted audit thresholds |
| Employee action returns 403 | Role inheritance, assignment ownership and selected-worker rules |

See [Setup](SETUP.md), [Deployment](DEPLOYMENT.md) and [Operations](OPERATIONS.md).
