# Media storage transition (MySQL BLOB → private S3 bucket)

## Objective

Keep existing /api/media/:id/file URLs stable. The API must continue serving
legacy BLOB images while new uploads and verified copies are stored in private
S3-compatible object storage. Never directly expose bucket credentials or
require public bucket access.

## 1. Provision a private Railway Storage Bucket

Provision a bucket in the same Railway production project and record its
S3 endpoint, region, bucket name, access key ID and secret key.

This step creates a billable storage resource. It is intentionally **not**
performed by a GitHub merge. Do not create or configure the bucket without
the operator's authorization.

Set the following on the **API service**, using Railway variable references
to the bucket credentials when available. Do not commit credential values:

- `MEDIA_S3_ENDPOINT`: S3-compatible HTTPS endpoint, without bucket path
- `MEDIA_S3_REGION`: signing region reported by Railway
- `MEDIA_S3_BUCKET`: bucket name
- `MEDIA_S3_ACCESS_KEY_ID`: private credential
- `MEDIA_S3_SECRET_ACCESS_KEY`: private credential

All five must be present or all absent. With none configured the API keeps
writing legacy MySQL BLOBs, so deployment is backwards compatible. With
complete configuration all **new** uploads go directly to the private bucket;
the database stores metadata and `object_key` only.

## 2. Schema deployment (non-destructive)

Before starting the updated API, run the standard `npm run migration:run`
pre-deploy step. It adds nullable `object_key`, permits legacy
`image_data` to be null and creates the durable object-deletion queue.
It does not overwrite or remove any existing media.

## 3. Copy legacy files, verify checksums

Take a MySQL backup/snapshot first. From a maintenance environment with
the same DB and MEDIA_S3 variables and the current compiled backend:

```sh
node dist/jobs/migrate-media-storage.js copy
```

Each image is copied to the bucket, downloaded again and compared using
SHA-256 **before** updating the database `object_key`. The source BLOB
remains intact. The operation is resumable; failed copies stop with an
error and can be restarted. It does not delete data.

## 4. Retire database BLOBs only after backup and verification

Review the migrated image counts and confirm the bucket has the expected
objects. Ensure production has all five S3 variables and can serve existing
media URLs. Preserve an independently restorable DB backup.

Only then, from a controlled maintenance environment:

```sh
CONFIRM_MEDIA_BLOB_PURGE=YES_I_HAVE_A_BACKUP node dist/jobs/migrate-media-storage.js purge
```

The command downloads and SHA-256 verifies **each** object against its
remaining database bytes before setting `image_data=NULL`. It does not
touch media without an `object_key`. Do not set this confirmation variable
as a persistent production service environment variable.

## 5. Deletions and rollback

Deleting an image first checks current references in offers and trends,
then atomically deletes its MySQL record and creates a durable
`media_object_deletions` queue entry. The worker retries S3 deletion after
server restarts or transient failures. Legacy BLOB-only images delete through
the existing MySQL transaction.

Before phase 4: disable S3 variables to restore MySQL-only reads and uploads.
After phase 4: the S3 bucket is required to read migrated images; never delete
the bucket, revert to a backend without object-key support, or revert the
database schema without restoring a verified backup and media objects.

## Limitations

- Maximum 5 MiB per photo, same as the existing API.
- Public image requests remain proxied through the API; bucket traffic is private.
- Running a database migration alone does **not** copy images.
- No new automated test suite was introduced.
