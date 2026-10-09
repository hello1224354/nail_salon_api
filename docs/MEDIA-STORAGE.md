# Media upload — MySQL storage and admin image management

## Data model

Admin-uploaded JPEG, PNG and WebP files are stored as **binary bytes in Railway MySQL**, in table `media_files`. Each record has a UUID, original filename, verified MIME type, size, creation metadata and an `image_data MEDIUMBLOB` field.

```text
Admin browser → POST /api/media (binary JPEG/PNG/WebP, ADMIN JWT)
             → Express checks role, rate limit, size & format
             → INSERT media_files (metadata + image_data MEDIUMBLOB)
             → /api/media/{uuid}/file
Public page  → GET /api/media/{uuid}/file → SELECT image_data from MySQL
```

No separate file host or Cloudflare R2 bucket is needed. This feature uses the existing MySQL connection on Railway; no new environment variables are necessary. Images are served via the existing same-origin Next.js `/api` rewrite to the Express API.

The `image_data` column is marked `select: false` in TypeORM so the admin gallery's paginated list fetches metadata **without** loading all binary files. Only the individual image endpoint selects the BLOB.

## API surface

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/media?page=1` | ADMIN | List up to 24 image records/page, metadata only |
| POST | `/api/media` | ADMIN | Binary JPEG/PNG/WebP request, appropriate `Content-Type`, optional URL-encoded `X-File-Name`; 5 MiB max; 30 uploads/hour/account |
| GET | `/api/media/:id/file` | Public, rate-limited | Return image bytes from MySQL |
| DELETE | `/api/media/:id` | ADMIN | Remove an unused image; reject if referenced by offers or trends |
| GET | `/api/site-content/admin/trends` | ADMIN | List Hot Trend entries |
| POST/PUT/DELETE | `/api/site-content/admin/trends[/:id]` | ADMIN | Add, update and delete trends |

The existing `/api/offers` API accepts the uploaded image URL as its `image` field. Newly created trends must select an image already in the media library. Existing Google Drive trend URLs and `/nails/...` files are **preserved** until an admin updates each item. No automatic download of legacy images occurs.

## Deployment

1. **Back up the current MySQL database** and verify that the backup can be restored. Images will increase database size and backup duration; monitor Railway storage/usage.
2. Build from the merged commit: `npm ci && npm run build`.
3. Run TypeORM migration `1791452400000-AddMediaFiles` against production **before** the new backend starts. The Railway API already uses `npm run migration:run` as its pre-deploy command.
4. Check Railway API health and backend logs; confirm the migration created `media_files` with `image_data MEDIUMBLOB`.
5. Verify the Vercel frontend deployment uses the same compatible GitHub source.
6. Sign in as ADMIN and test: upload a small image, open its `/api/media/:id/file` URL, assign it to an offer/trend, confirm homepage rendering, then replace/remove it and clean up the unused test file.

**Do not use production customer data in test screenshots or upload private images for testing.**

## Admin UI

- **Thư viện ảnh**: upload from mobile/desktop, preview and delete unused images.
- **Ưu đãi**: choose an image already uploaded or upload a new one while editing the offer.
- **Hot Trend**: add/edit an image with Instagram URL, title and display order; delete a trend without deleting its underlying media file.

The UI leaves existing Google Drive and static images unchanged until replaced.

## Limits and operating considerations

- **Storage is not unlimited or automatically free.** A 5 MiB image adds approximately 5 MiB to the database, plus backup/storage overhead. Railway storage and transfer usage continue to apply.
- **Operational trade-off:** Storing image BLOBs alongside booking data increases database size and I/O load. Suitable for a smaller image gallery and early-stage site, not an unrestricted multi-user photo hosting service.
- **Cache:** Images use long-lived UUID URLs and a one-hour cache header. Each upload creates a new URL, so replacing an image in an offer/trend will cause the frontend to use a new URL.
- **Validation:** JPEG/PNG/WebP signature validation and maximum request size. Images are not yet re-encoded/stripped of EXIF metadata; restrict uploads to trusted admins.
- **Integrity:** Admin deletion is blocked for images referenced in offers or trends. The URLs are stored in those tables, rather than MySQL foreign keys; concurrent content updates should be handled carefully.
- **Recovery:** Backups must include the full `media_files` BLOB data, not just table schema/metadata. Restore tests should verify image URLs and booking data.
