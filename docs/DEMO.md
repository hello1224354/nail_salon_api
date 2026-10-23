# Product tour

> **Legacy full-stack demo:** These links open the original booking, staff, and admin application at its Vercel URL. The current customer-facing salon site is [serpentenailroom.site](https://serpentenailroom.site/), whose booking buttons open KiotViet. Appointments made in the legacy demo are **not synchronized** with KiotViet; use test accounts and synthetic data only.

[Open Serpente Nail Room](https://nail-salon-web-v2.vercel.app/)

The application combines a public salon website with authenticated customer, staff and administrator workflows. Use accounts with the appropriate roles to explore protected pages; this repository does not publish demo credentials.

## Public website

| Page | What it offers |
| --- | --- |
| [Home](https://nail-salon-web-v2.vercel.app/) | Salon information, promotions, gallery, reviews and locations |
| [Services](https://nail-salon-web-v2.vercel.app/services) | Branch-specific service categories, descriptions and reference prices |
| [Booking](https://nail-salon-web-v2.vercel.app/book) | Authenticated selection of services, party size, date and available start time |

## Customer journey

1. Register with email verification or sign in; an unrecognized browser requires an email OTP.
2. Select a branch and bookable services.
3. Select party size and date, then choose an available start time.
4. Submit a contact phone number and confirm the booking.
5. Review the appointment, estimated price, status and eight-character booking reference in [My appointments](https://nail-salon-web-v2.vercel.app/appointments).

The customer chooses a time, not an employee. The server allocates employees and creates a single appointment for the party. A displayed time can become unavailable before submission; the API validates capacity again when reserving.

## Staff workspace

The [staff page](https://nail-salon-web-v2.vercel.app/staff) provides assigned jobs, personal work progress and walk-in recording. Staff can look up a booking for reception, record actual charges or extra services, request an unstarted job transfer and accept incoming requests. A primary worker can request an available helper for one booked service when the assistance rules permit it.

Reception lookup is read-only and branch-scoped for staff; finding another worker's booking does not transfer ownership. Staff accounts can also make personal bookings through the customer workflow.

## Administrator workspace

The [admin sign-in page](https://nail-salon-web-v2.vercel.app/admin/login) leads to booking search, catalog and staff management, image/content management and operational summaries. Appointment search combines booking-reference prefix, branch, date and status filters with server-side pagination.

Administrators can edit eligible appointments, correct walk-in records and perform supported work actions on behalf of a selected employee. They cannot accept or decline a transfer for its recipient. The [staff-management workspace](https://nail-salon-web-v2.vercel.app/admin/staff) supports administrative employee operations.

Revenue summaries combine completed online-booking charges and recorded walk-in charges. They are operational records, not evidence of an online payment transaction.

## Technical reading

- [Booking rules](BOOKING.md): allocation, work ownership and state transitions.
- [API reference](API.md): endpoint and permission details.
- [Engineering case study](PORTFOLIO.md): design decisions and trade-offs.
