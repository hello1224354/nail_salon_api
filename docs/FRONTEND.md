# Frontend

The `frontend/` application uses Next.js 16 App Router, React 19, TypeScript and Tailwind CSS 4. Public, account, staff and administrator pages share one application and API client.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Salon introduction, offers, trends and reviews |
| `/services` | Branch-specific service catalog |
| `/book` | Service, party-size and available-time selection |
| `/appointments` | Personal appointment history and status filtering |
| `/login`, `/register` | Login/OTP and email-verified registration |
| `/forgot-password` | Email-based password reset |
| `/account/security` | Account password/security flow |
| `/staff` | Assigned online bookings and walk-in entry/history |
| `/admin/login` | Administrator login entry |
| `/admin` | Operational dashboard and catalog/content management |
| `/admin/staff` | Staff-account management page |
| `/admin/security` | Administrator account security |

Routes and buttons guide the user, while API role/ownership checks remain authoritative. The repository also contains error/loading/not-found boundaries and metadata routes.

## Layout and request flow

[layout.tsx](../frontend/src/app/layout.tsx) composes the shared header/footer, branch context, route motion and traffic tracker. Global styles and booking-specific styles provide the visual system. Static assets live under `frontend/public`; uploaded media is delivered through `/api/media/:id/file`.

[proxy.ts](../frontend/src/proxy.ts) creates a request-specific CSP nonce. The layout opts into request-time rendering. Keep added script requirements consistent with this policy.

Browser requests use same-origin `/api/...`. [next.config.ts](../frontend/next.config.ts) rewrites them to the origin configured in `NEXT_PUBLIC_API_BASE_URL`. The frontend URL and hosting configuration are described in [Deployment](DEPLOYMENT.md).

## API and authentication state

[api.ts](../frontend/src/lib/api.ts) defines response interfaces, request/error helpers, bearer-token attachment and credentialed requests. Its `fetchAllPages` helper requests pages of 100 until the reported final page.

[auth.ts](../frontend/src/lib/auth.ts) stores the access token and user in module memory, restores sessions using the refresh cookie and shares an in-flight refresh promise to avoid duplicate refresh work within the client. The access token is not stored in localStorage. Logout clears local authentication state before attempting server-side session revocation. See [Authentication](AUTH-SECURITY.md) for server-side rotation and cookie behavior.

## Booking and appointment history

[BookingForm.tsx](../frontend/src/components/booking/BookingForm.tsx) restores the session, loads branch/service data, and queries available times for the selected services, party size and business date. Availability requests are debounced and superseded requests can be aborted. Customers select a time, not an employee.

The form submits `service_ids`, `start_time`, `party_size` and `customer_phone`; the API derives the branch from the selected services. The API rechecks availability and assigns staff transactionally. A successful response shows the booking reference and appointment summary; a slot conflict requires updated availability. Business-time display uses Vietnam time.

[MyAppointments.tsx](../frontend/src/components/appointments/MyAppointments.tsx) uses `fetchAllPages` with `scope=mine`, so it is not limited to the first 100 appointments. It then filters the loaded records by status, including `no_show`. Loading all pages is different from a server-paginated history interface and has a cost as history grows.

## Staff workspace

The [staff page](../frontend/src/app/staff/page.tsx) loads the current staff profile, branch services, assigned online appointments, recent walk-ins and transfer peers. Its service and appointment reads request the first 100 records; the walk-in API returns the staff member's latest 100 records. These are not unlimited-history views.

The workspace supports walk-in entry and assigned-booking operations through shared components. A local 30-second clock updates time-dependent display; it should not be interpreted as a claim that every dataset is refreshed on that interval. Transfers, service assistance and work completion remain subject to the API's assignment and state rules.

## Administrator interfaces

[AdminDashboard.tsx](../frontend/src/components/admin/AdminDashboard.tsx) provides overview, appointments, services, staff, branches, offers, media, trends and walk-in panels. Summary components cover daily, monthly and lifetime reporting. The separate [staff management page](../frontend/src/app/admin/staff/page.tsx) manages employee accounts.

Appointments use server-side filtering and 20 rows per page. Filters include branch, status, a 1-8 hexadecimal booking-code prefix and date bounds. The UI converts an inclusive business-date end into the API's exclusive `to` boundary. Catalog loading follows all pages where implemented rather than assuming one response contains every record.

The appointment detail/work interfaces reflect per-worker progress and actual charges. Administrators acting on a worker's behalf must send the selected employee identity required by the API. Early starts require explicit confirmation; the backend does not impose an unconditional ban on starting before the scheduled time.

Admin media upload attempts browser-side image optimization, while the API independently validates the final bytes. Offers and trends can reference the media library. See [Media storage](MEDIA-STORAGE.md).

## Traffic and reporting

[WebsiteVisitTracker.tsx](../frontend/src/components/traffic/WebsiteVisitTracker.tsx) sends a visit pulse immediately and every 60 seconds, using a browser-tab session identifier. The API considers sessions active within five minutes online. This measures visit sessions, not unique people or page views.

Revenue reports summarize recorded service charges, not settled payment transactions. Definitions and operational caveats are in [Booking](BOOKING.md) and [Operations](OPERATIONS.md).

Run the frontend typecheck, lint and build commands in [Contributing](CONTRIBUTING.md). Review interactive flows with suitable test accounts when changing their behavior.
