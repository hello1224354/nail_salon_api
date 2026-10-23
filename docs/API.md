# HTTP API reference

The API is defined in [app.ts](../src/app.ts) and module route/controller/DTO files. Business endpoints use `/api`; `/health` is separate. Browser clients use the frontend's same-origin rewrite.

## Conventions

Protected requests use `Authorization: Bearer <access_token>`. Send `Content-Type: application/json` for JSON bodies. Refresh/logout use the refresh cookie and require a trusted `Origin`. Media upload uses a raw binary body instead of JSON or multipart form data.

Most responses use `{ "success": { "message": "...", "data": ... } }`; `message` is not present on every endpoint. Errors use `{ "error": { "code": "...", "message": "..." } }`. Paginated collections return their named array with `total`, `page`, `limit` and `total_pages` inside `success.data`. Image reads return bytes; traffic pulses return 204 with no body. Responses include `X-Request-Id`.

Access labels below describe effective route access:

- **Public:** no JWT required.
- **Auth:** CUSTOMER, STAFF or ADMIN; service-level ownership still applies.
- **Staff/Admin:** employee functions, with selected-worker requirements for ADMIN.
- **Admin:** administrative access only.
- **Cookie + Origin:** refresh proof and an explicitly trusted browser origin.

The role middleware permits STAFF on customer routes and ADMIN on staff/customer routes. This does not bypass domain-level restrictions. See [Authentication](AUTH-SECURITY.md).

## Accounts and sessions

| Method | Endpoint | Access | Input or purpose |
| --- | --- | --- | --- |
| POST | `/api/users/register/code` | Public | `email`; generic 202 response |
| POST | `/api/users/register` | Public | `full_name`, `email`, `password`, `code`; creates CUSTOMER |
| POST | `/api/users/login` | Public | `email`, `password`, optional `remember_me`; 200 session or 202 OTP challenge |
| POST | `/api/users/login/mfa/verify` | Public | `challenge_id`, `code`; completes OTP login |
| POST | `/api/users/session/refresh` | Cookie + Origin | Rotates refresh proof and returns access JWT |
| POST | `/api/users/session/logout` | Cookie + Origin | Revokes refresh family and clears cookie |
| POST | `/api/users/password/forgot` | Public | `email`; requests reset code |
| POST | `/api/users/password/reset` | Public | `email`, `code`, `new_password` |
| POST | `/api/users/password/change/code` | Auth | Requests account password-change code |
| POST | `/api/users/password/change` | Auth | `current_password`, `new_password`, `code` |
| GET | `/api/users/me` | Auth | Current account |
| DELETE | `/api/users/me` | Auth | `current_password`; self-deletion subject to service rules |

All three roles require login OTP on an untrusted browser. For HTTP 202 login, read `success.data.mfa_required`, `challenge_id`, `masked_email` and `expires_at`, then submit the code to the verify route. Registration does not itself return a login session.

Source: [account DTOs](../src/modules/users/users.dto.ts), [account routes](../src/modules/users/users.routes.ts).

## Appointments and summaries

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/appointments` | Auth | Scoped appointment list |
| GET | `/api/appointments/availability` | Auth | Start times for services, date and party size |
| POST | `/api/appointments` | Auth | Create a personal booking with server-assigned employees |
| GET | `/api/appointments/:id` | Auth | Own/assigned appointment; ADMIN can access any |
| PUT | `/api/appointments/:id` | Staff/Admin | Valid state/work updates; schedule/details are ADMIN-only |
| DELETE | `/api/appointments/:id` | Admin | Delete an appointment and release applicable capacity |
| GET | `/api/appointments/admin/today-summary` | Admin | Current Vietnam business-day counts and revenue |
| GET | `/api/appointments/admin/month-summary` | Admin | `month=YYYY-MM`; monthly counts and revenue |
| GET | `/api/appointments/admin/lifetime-summary` | Admin | Lifetime online-booking and walk-in totals/revenue |

### List query

| Parameter | Contract |
| --- | --- |
| `page` | 1-1000; default 1 |
| `limit` | 1-100; default 5 |
| `scope` | Only `mine` is supported; STAFF/ADMIN can list their personal customer bookings |
| `branch_id` | Positive integer |
| `staff_id` | UUID; filters assignment membership |
| `status` | `pending`, `confirmed`, `in_progress`, `no_show`, `completed`, `cancelled` |
| `booking_code` | ADMIN-only 1-8 hex-character reference prefix |
| `from`, `to` | Timezone-bearing ISO timestamps; inclusive lower and exclusive upper start-time bounds |

CUSTOMER always sees their own appointments. STAFF sees assigned jobs unless `scope=mine`; ADMIN sees all unless requesting personal scope. Filters do not expand the caller's access. Merged legacy rows are excluded.

### Availability and creation

Availability requires comma-separated service UUIDs, a date representing 00:00 in Vietnam and optional positive `party_size` (default 1):

```http
GET /api/appointments/availability?service_ids=<service-uuid>&date=<URL-encoded-midnight-with-offset>&party_size=2
Authorization: Bearer <access-token>
```

The response data contains `branch_id`, `duration_minutes`, `party_size`, `max_party_size` and `slots` (ISO start timestamps). Services must be bookable and in the same branch. Select an available start within the permitted future booking window.

```json
{
  "service_ids": ["00000000-0000-4000-8000-000000000001"],
  "start_time": "2030-01-02T10:00:00+07:00",
  "party_size": 2,
  "customer_phone": "0900000000"
}
```

This is an illustrative shape: replace the service ID, date and phone with valid data. The date must be 3 hours to 14 days ahead when submitting. The phone is normalized to Vietnamese `+84` format. Customer identity comes from authentication; `staff_id`, `user_id` and `customer_email` overrides are rejected.

HTTP 201 returns **one appointment** with `party_size`, `booking_group_id`, `staff_assignments` and `appointment_services`. Staff selection and complete-party reservation occur in a transaction. See [Booking](BOOKING.md) for capacity rules.

### Work state and admin edits

A staff start request can use:

```json
{ "status": "in_progress", "early_start_confirmed": true }
```

The readiness confirmation is required only when starting early. ADMIN additionally supplies `acting_staff_id` for start/completion. STAFF must not supply that field. Completion marks the acting worker; the booking remains active until all assignments complete.

ADMIN detail updates accept `branch_id`, `service_ids`, `start_time`, `customer_phone`, and either `staff_id` or `staff_ids`. `staff_ids` has one distinct employee UUID or `null` automatic position per guest. Changing branch requires target-branch services. Schedule edits are limited to pending/confirmed bookings and reallocate transactionally. Do not combine status and detail updates.

Sources: [appointment DTOs](../src/modules/appointments/appointments.dto.ts), [booking service](../src/modules/appointments/appointments.service.ts).

## Staff work, reception, transfers and assistance

| Method | Endpoint | Access | Contract |
| --- | --- | --- | --- |
| GET | `/api/appointments/reception/search` | Staff/Admin | `q`: full 8-character reference or phone; STAFF branch-scoped |
| PUT | `/api/appointments/:id/work-prices` | Staff/Admin | `prices` and `extras` arrays; updates the selected worker's owned services |
| PUT | `/api/appointments/:id/actual-prices/:serviceId` | Staff/Admin | `actual_price`; updates one owned charge |
| POST | `/api/appointments/:id/assists` | Staff/Admin | `service_id`; automatically assigns an available helper |
| DELETE | `/api/appointments/:id/assists/:helperId` | Staff/Admin | Cancels eligible unstarted assistance |
| GET | `/api/appointments/transfers/peers` | Staff/Admin | Same-branch recipient candidates |
| GET | `/api/appointments/transfers/requests` | Staff/Admin | Incoming/outgoing requests; ADMIN sees unscoped lists |
| POST | `/api/appointments/:id/transfers` | Staff/Admin | `to_staff_id`; ADMIN also supplies `from_staff_id` |
| POST | `/api/appointments/transfers/:requestId/:action` | Staff/Admin | `accept`, `decline` or `cancel`; ADMIN may only cancel |

For work-prices, single-price, assist and assist-cancellation requests, ADMIN supplies `staff_id` in the body. For transfer-peer lookup, ADMIN supplies it in the query; for transfer cancellation, in the body. STAFF derives its worker identity from the JWT and cannot supply a selected employee. Transfer acceptance/decline must be performed by the receiving STAFF account; cancellation belongs to the sender.

A work-price body for STAFF:

```json
{
  "prices": [
    { "service_id": "00000000-0000-4000-8000-000000000001", "actual_price": 150000 }
  ],
  "extras": [
    { "name": "Additional nail art", "price": 30000 }
  ]
}
```

Use real owned service IDs. Both arrays are required, with at most 40 entries each. Prices are whole VND amounts from 0 to 1,000,000,000; `null` on a booked price uses its reference snapshot. Saving replaces that worker's extra lines. Helpers may price only their delegated service and cannot add extras. Work must be in an editable state and the assignment must not be completed.

Reception returns at most ten matches and grants no write access. Transfers expire after three minutes and have their own logical-capacity policy. Assistance requires an active primary worker and at least two booked services. See [Booking](BOOKING.md) for the complete rules.

Source: [work controller](../src/modules/appointments/booking-work.controller.ts).

## Walk-ins

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/walk-ins` | Staff/Admin | Own recent visits for STAFF; filtered/paginated list for ADMIN |
| POST | `/api/walk-ins` | Staff/Admin | Record customer details and actual service charges |
| PUT | `/api/walk-ins/:id` | Admin | Correct customer details and prices for the same service set |
| DELETE | `/api/walk-ins/:id` | Admin | Delete a visit |

Creation requires `customer_name` and `services: [{service_id, actual_price}]` (1-40 distinct services), with optional `customer_phone` and `customer_email`. ADMIN also selects `staff_id`; STAFF cannot provide staff, branch or user overrides. The employee's branch determines the service catalog.

ADMIN list filters: `month=YYYY-MM`, `branch_id`, `from`, `to`, `page` (default 1) and `limit` (default 50, maximum 100). STAFF receives the latest 100 own visits; advanced month/branch/date filters are rejected and list pagination is fixed to page 1. Admin edits preserve employee, branch, date and service membership.

Source: [walk-in DTO](../src/modules/walk-ins/walk-ins.dto.ts), [walk-in service](../src/modules/walk-ins/walk-ins.service.ts).

## Catalog, branches and employees

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/branches` | Public | Paginated branches |
| GET | `/api/branches/admin` | Admin | Administrative branch list |
| GET | `/api/branches/:id` | Public | Branch details |
| POST | `/api/branches` | Admin | Create branch |
| PUT | `/api/branches/:id` | Admin | Update branch |
| DELETE | `/api/branches/:id` | Admin | Delete branch subject to service guards |
| GET | `/api/services` | Public | Paginated catalog; optional `branch_id` |
| GET | `/api/services/admin` | Admin | Administrative service list |
| GET | `/api/services/categories` | Public | Category names |
| POST | `/api/services/categories` | Admin | Create category |
| GET | `/api/services/:id` | Public | Service details |
| POST | `/api/services` | Admin | Create service |
| PUT | `/api/services/:id` | Admin | Update service |
| DELETE | `/api/services/:id` | Admin | Delete service |
| GET | `/api/staffs` | Admin | Staff list |
| GET | `/api/staffs/admin` | Admin | Staff list alias |
| GET | `/api/staffs/me` | Staff/Admin | Signed-in account's staff profile; requires a staff record |
| GET | `/api/staffs/:id` | Admin | Employee details |
| POST | `/api/staffs` | Admin | Create employee |
| PUT | `/api/staffs/:id` | Admin | Update employee, branch or recurring hours |
| DELETE | `/api/staffs/:id` | Admin | Delete employee subject to service guards |
| GET | `/api/offers` | Public | Current promotions; optional branch filter |
| GET | `/api/offers/admin` | Admin | Paginated administrative promotions |
| GET | `/api/offers/:id` | Admin | Promotion details |
| POST | `/api/offers` | Admin | Create promotion |
| PUT | `/api/offers/:id` | Admin | Update promotion |
| DELETE | `/api/offers/:id` | Admin | Delete promotion |

Write schemas and validation are defined in [branch DTOs](../src/modules/branches/branches.dto.ts), [service DTOs](../src/modules/services/services.dto.ts), [staff DTOs](../src/modules/staffs/staffs.dto.ts) and [offer DTOs](../src/modules/offers/offers.dto.ts). A database entity may contain fields not accepted by its write DTO; do not submit the entity shape as an assumed API contract.

## Site content, media and traffic

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/site-content` | Public | Salon content, branch reviews and trends |
| GET | `/api/site-content/admin/trends` | Admin | List trends |
| POST | `/api/site-content/admin/trends` | Admin | Create trend from an uploaded media URL |
| PUT | `/api/site-content/admin/trends/:id` | Admin | Update trend |
| DELETE | `/api/site-content/admin/trends/:id` | Admin | Delete trend; media remains separate |
| GET | `/api/media` | Admin | Metadata list; `page`, 24 files per page |
| POST | `/api/media` | Admin | Raw JPEG/PNG/WebP bytes; maximum 5 MiB |
| GET | `/api/media/:id/file` | Public | Image bytes and cache headers |
| DELETE | `/api/media/:id` | Admin | Delete media if no offer/trend references it |
| POST | `/api/traffic/pulse` | Public | `session_id` UUID; records browser-tab activity; HTTP 204 |
| GET | `/api/traffic/admin/summary` | Admin | `total_visits` and `online_visits` |
| GET | `/health` | Public | `{ "status": "ok" }`; process-level health response |

Trend writes accept `image_src`, `instagram_url`, optional `title` and `sort_order`. The image must reference an existing `/api/media/<uuid>/file`; the salon-content parent with ID 1 must exist. Media details are documented in [Media storage](MEDIA-STORAGE.md).

Traffic totals count session identifiers, not unique people. Online visits have activity within five minutes. `/health` does not perform a fresh database query or exercise email/booking behavior.

## Error handling

| Code or class | Meaning |
| --- | --- |
| `VALIDATION_ERROR` / HTTP 400 | Invalid input shape, identifier, amount or date |
| `AUTHENTICATION_REQUIRED`, `INVALID_REFRESH_SESSION` / HTTP 401 | Missing or invalid authentication/session |
| `FORBIDDEN`, `UNTRUSTED_ORIGIN` / HTTP 403 | Role/ownership or origin restriction |
| `APPOINTMENT_NOT_FOUND` / HTTP 404 | Missing or inaccessible appointment |
| `SLOT_UNAVAILABLE` / HTTP 409 | Required staff capacity could not be allocated |
| `EARLY_START_CONFIRMATION_REQUIRED` / HTTP 409 | Early start needs explicit readiness confirmation |
| `APPOINTMENT_NOT_STARTED_YET` / HTTP 409 | Early completion lacks a started assignment |
| `APPOINTMENT_NOT_EDITABLE`, `INVALID_STATUS_TRANSITION` / HTTP 409 | Operation conflicts with current workflow |
| `TRANSFER_ALREADY_PENDING`, `TRANSFER_NOT_PENDING`, `TRANSFER_INVALIDATED` / HTTP 409 | Transfer lifecycle conflict |
| `MEDIA_IN_USE` / HTTP 409 | Image still referenced by content |
| `REFRESH_RACE` / HTTP 409 | Near-simultaneous refresh rotation |
| `RATE_LIMIT_EXCEEDED`, `TOO_MANY_PENDING_APPOINTMENTS` / HTTP 429 | Request or pending-booking limit |

These are representative codes, not an exhaustive list. Use `error.code` alongside HTTP status and `X-Request-Id` when diagnosing failures. Source: [error handler](../src/common/error-handler.ts).
