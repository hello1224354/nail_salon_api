# Portfolio visuals — screenshot and demo checklist

**Purpose:** Keep the portfolio visuals accurate, legible and free of real customer data. The application is live, but the screenshot gallery should only contain actual captures from the deployed app or an explicitly labeled test environment. Do not create mock images and present them as production screenshots.

## Verified public pages

- [Homepage](https://nail-salon-web-v2.vercel.app/) — hero, service promotions, salon content, Instagram showcase and customer reviews.
- [Services](https://nail-salon-web-v2.vercel.app/services) — category filters and service pricing.
- [Booking page](https://nail-salon-web-v2.vercel.app/book) — requires customer authentication for availability and booking.
- [Admin login](https://nail-salon-web-v2.vercel.app/admin/login) — no demo admin account is exposed publicly.

The public homepage and services pages were inspected through a browser on 2026-10-09. Neither inspection nor a CI build constitutes proof of an authorized logged-in user journey.

## Recommended real screenshot gallery

| Image | Source page / state | Safe capture guidance |
|---|---|---|
| `home-desktop.webp` | Homepage desktop | 1440px wide viewport, no browser extensions or personal tabs |
| `services-desktop.webp` | Services/catalog desktop | Show filters and representative service cards |
| `booking-mobile.webp` | Customer booking mobile | Use an authorized test account, show branch/services/available slots only |
| `booking-success.webp` | Booking confirmation | **Use a dedicated disposable test booking**, hide booking code, phone, name, email |
| `admin-appointments.webp` | Admin appointments table | Replace all customer names/phones/emails and booking codes with non-real test fixtures; include date filters/search |
| `admin-dashboard.webp` | Overview charts/summary | Sanitize any customer data and business-sensitive metrics if needed |

**Image naming convention:** `docs/assets/<name>.webp`; file names above are a capture plan, **not files that are claimed to exist**. Commit screenshots only when they are authentic and reviewed. Prefer width under 1600px and WebP/JPEG compression to avoid bloating the repository.

## How to add visual assets to the portfolio

1. Log into an authorized test environment/profile (never share credentials or OTP in README).
2. Capture real website views at desktop and mobile viewport sizes. Ensure public screenshots use live production styling.
3. Remove/replace personal information, live booking reference codes and privileged data **before** adding the files to Git.
4. Add photos to `docs/assets/` and render them via relative Markdown links, e.g. `![Service catalog](assets/services-desktop.webp)`.
5. Verify on GitHub that images load and reflect the current app version. Update the gallery when the UI changes.

## Short video demo (optional)

A 60–90 second video is sufficient: public homepage (10s), service catalog (10s), read-only available slots with a test session (20s), anonymized confirmation/admin search (20s), and architecture/CI (20s). Only show booking creation with explicitly approved test data and remove those bookings afterward.

## Current media status

Actual *public page routes* are linked above. Screenshots and demo video are **not yet checked into this branch**; this is intentional rather than publishing fabricated or potentially sensitive images. An anonymized screenshot must be reviewed before publishing.
