# Media storage and content management

Administrator uploads are stored in MySQL in `media_files`. Each record contains a UUID, filename, verified MIME type, byte size, creation metadata and an `image_data MEDIUMBLOB`. The feature uses the existing database connection and does not require an object-store account.

## Upload and read flow

The admin client sends raw image bytes to `POST /api/media` with an ADMIN bearer token and the appropriate `Content-Type`. The API checks authorization, rate limit, size and image signature before saving the bytes. It returns a public `/api/media/{uuid}/file` URL, served through the same-origin frontend rewrite.

The [entity](../src/modules/media/media-file.entity.ts) marks `image_data` as `select: false`. Gallery list requests load metadata; individual file requests explicitly select the BLOB. See [routes](../src/modules/media/media.routes.ts), [validation](../src/modules/media/media-validation.ts) and [service](../src/modules/media/media.service.ts).

## API

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/api/media?page=1` | ADMIN | Metadata list, 24 records per page; page 1-1000 |
| POST | `/api/media` | ADMIN | Raw JPEG, PNG or WebP; at most 5 MiB; 100 upload requests/hour/account |
| GET | `/api/media/:id/file` | Public, rate-limited | Image bytes with verified MIME type |
| DELETE | `/api/media/:id` | ADMIN | Delete an image after reference checks |
| GET | `/api/site-content/admin/trends` | ADMIN | List trends for salon content 1 |
| POST | `/api/site-content/admin/trends` | ADMIN | Create a trend |
| PUT | `/api/site-content/admin/trends/:id` | ADMIN | Replace editable trend fields |
| DELETE | `/api/site-content/admin/trends/:id` | ADMIN | Remove a trend record |

Uploads are binary bodies, not JSON/base64 or multipart form data. An optional `X-File-Name` header carries the URL-encoded filename. The declared content type must match the detected JPEG/PNG/WebP format. The backend validates bytes but does not re-encode or resize the image. HTTP limiter counters are process-local; see [Authentication](AUTH-SECURITY.md).

File responses set `Cache-Control: public, max-age=3600, immutable` and inline disposition. A new upload receives a new UUID URL. Deletion removes the stored record but does not invalidate copies already cached by clients or intermediaries.

## Offers and trends

Offers reference images through their `image` field; trends use `image_src`. Trend create/update requires an existing uploaded-media URL, an Instagram HTTPS URL, and optionally a title (up to 255 characters) and integer `sort_order` (0-1,000,000). Creation requires the parent `salon_content` record with ID 1.

[Trend routes](../src/modules/site-content/site-content-admin.routes.ts) manage the content record separately from the underlying image. Deleting a trend does not delete its media file. Media deletion checks offer/trend references transactionally and rejects images still in use. These references are URL strings, not database foreign keys; the check is not a general foreign-key guarantee for every possible concurrent content update.

Existing static or external image references are not automatically imported into the media library. Newly selected trend images must satisfy the uploaded-media requirement.

## Admin interface

[AdminMedia.tsx](../frontend/src/components/admin/AdminMedia.tsx) provides upload, preview, selection and deletion. It attempts to reduce an image to a maximum side of 1600 pixels and encode WebP at quality 0.82. It uses that result only when smaller than the original; the final upload must still satisfy the server's 5 MiB limit. Raw API uploads do not receive this browser-side optimization.

The gallery supports offers and trend editing. Use synthetic or authorized public images when validating the workflow, and check both successful retrieval and rejection of referenced-image deletion.

## Storage and recovery

BLOB storage increases database size, I/O and backup volume. Monitor actual database capacity and transfer usage; application upload limits are not a storage quota. Public image URLs are appropriate for public site assets, not private documents.

Backups must include the complete `image_data` bytes as well as metadata and referencing content. Test restored image URLs alongside appointment data. The repository's incremental migrations are not a full database bootstrap; follow [Database](DATABASE.md) and [Setup](SETUP.md) when provisioning a new environment. No production table contents, image counts or backup status can be inferred from the entity definitions alone.
