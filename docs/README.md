# Technical documentation

This documentation describes Serpente Nail Room for developers, maintainers and reviewers. Start with the [project overview](../README.md) for the product and stack.

## Reading guide

| Document | Purpose |
| --- | --- |
| [Product tour](DEMO.md) | Public pages and customer, staff and admin workflows |
| [Setup](SETUP.md) | Local services, configuration and initial data prerequisites |
| [Architecture](ARCHITECTURE.md) | Components, request flow and transaction boundaries |
| [API reference](API.md) | Routes, access rules, request examples and errors |
| [Booking](BOOKING.md) | Availability, allocation, group work, transfers and assistance |
| [Database](DATABASE.md) | Entity model, snapshots, indexes and migrations |
| [Authentication and security](AUTH-SECURITY.md) | Roles, OTP, sessions, trusted browsers and request protection |
| [Frontend](FRONTEND.md) | Pages, client state, API access and operational interfaces |
| [Media storage](MEDIA-STORAGE.md) | Image uploads, binary storage and content references |
| [Deployment](DEPLOYMENT.md) | Frontend/API deployment requirements and rollback |
| [Operations](OPERATIONS.md) | Workers, diagnostics, backups and retention |
| [Contributing](CONTRIBUTING.md) | Change workflow and verification commands |
| [Engineering case study](PORTFOLIO.md) | Design rationale and trade-offs |

For local development, read Setup, Architecture and API. For scheduling changes, read Booking and Database together. For hosting or maintenance, read Deployment and Operations.

## Shared terminology

| Term | Meaning |
| --- | --- |
| Appointment | One customer submission, including a party of one or more guests |
| Assignment | An employee's work on an appointment; primary assignments correspond to guest positions |
| Service helper | An additional assignment handling one booked service for an existing guest position |
| Booking reference | The first eight hexadecimal characters of `booking_group_id`, falling back to `id`, displayed uppercase |
| Reservation slot | A 15-minute staff interval identified by `(staff_id, slot_start)` |
| Transfer hold | A logical reserved interval associated with a pending or accepted work transfer |
| Snapshot | Booking-time names, prices, durations and contact/branch details retained with a transaction |
| Walk-in | A separately recorded service visit, not an online reservation |
| Business time | `Asia/Ho_Chi_Minh` (UTC+07:00); persisted appointment times use UTC |

`booking_group_id` remains the reference identifier; it does not mean that new group bookings create one appointment per employee. `merged_into_id` supports filtering legacy merged appointment rows.

## Keeping documentation current

Update API contracts, diagrams, examples and related pages with the code change that affects them. Source links identify implementation entry points; runtime settings, database contents and deployment status must be checked in the target environment. Repository documentation does not certify a production deployment or database snapshot.
