# Serpente production hosting on a VPS

This is an **alternative** to Railway + Vercel, not a live cutover. It runs the
existing Next.js frontend, Express backend, MySQL 8, database migrations,
retention cleanup, and automatic HTTPS on one Ubuntu VPS through Docker Compose.

## Requirements

- A Linux VPS (start at **2 vCPU / 4 GiB RAM**, 40+ GiB persistent disk).
  A higher specification may be needed during builds and as bookings grow.
- Public IPv4, SSH access with a key, Docker Engine + Docker Compose v2.
- A domain you own with an A record pointing to the VPS public IP.
- An **independent, encrypted offsite backup location**; the VPS alone is not
  a backup strategy.
- Ports 80/443 open to the internet, SSH restricted to your own IP. **Never**
  open MySQL port 3306 to the internet. The Compose stack does not publish it.

## 1. Configure (before running a production service)

```bash
git clone https://github.com/hello1224354/nail_salon_api.git
cd nail_salon_api
cp .env.production.example .env.production
chmod 600 .env.production
# edit .env.production and replace EVERY placeholder before start
```

Set `SITE_ADDRESS` to the real domain (e.g. `nails.example.com`), `ACME_EMAIL`,
`CORS_ORIGIN=https://nails.example.com`, fresh `DB_PASSWORD`,
`MYSQL_ROOT_PASSWORD`, and `JWT_SECRET`, plus existing Gmail OAuth settings.
For a new database, use a dedicated DB username, not `root`.

Generate cryptographically random values separately, e.g. `openssl rand -hex 32`.
Never commit `.env.production`, put credentials in GitHub Actions logs, or send
them in chat.

`NEXT_PUBLIC_API_BASE_URL` in the VPS frontend image deliberately points to
`http://api:3000`, an **internal Docker network hostname**. Browser calls are
same-origin `/api/*`, rewritten by the existing Next configuration. Thus the
public website needs only one DNS name and no publicly exposed API port.

## 2. Transfer the Railway production data (mandatory before cutover)

**Do not start taking bookings on the VPS with an empty MySQL DB.**

1. Create a recent verified backup of Railway MySQL **before making any change**.
2. Perform a dry run with a copy on a temporary database. Compare row counts
   and the important entities (`users`, `appointments`, `branches`,
   `services`, `staff_booking_slots`, and `migrations`).
3. Prepare maintenance/downtime for the final cutover; stop writes on the
   OLD instance, take a **final consistent** SQL dump, and protect it.
4. Start only the VPS MySQL container:
   ```bash
   docker compose --env-file .env.production -f compose.production.yml up -d db
   ```
5. After exporting the final Railway dump and copying it privately to the VPS,
   restore it to the NEW database (example for uncompressed SQL):
   ```bash
   docker compose --env-file .env.production -f compose.production.yml exec -T db \
     sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"' \
     < /secure/path/railway-final.sql
   ```
   For `.sql.gz`, decompress via `gzip -dc` into the same command.
6. Verify the restored schema, row counts and sample booking data **before**
   permitting the new website to accept bookings. The `migrate` service runs
   TypeORM migrations and the API starts only after migration succeeds.

Do not paste a production SQL dump into a GitHub issue, chat or repository.
A rollback after customers book on the NEW DB must include those writes;
simply reverting DNS to an older copy risks losing appointments.

## 3. Start services & HTTPS

After the domain A record points to the VPS and the old data is restored:

```bash
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 api frontend caddy migrate
```

Visit `https://YOUR_DOMAIN/` and `https://YOUR_DOMAIN/api/branches?page=1&limit=5`.

Caddy issues and renews TLS certificates when DNS is correct and ports 80/443
are reachable. **Do not enter real credentials over plain HTTP.**

Test end-to-end with deliberately created test data: signup Gmail OTP, login
and session refresh, browsing services, slot availability, booking creation,
admin login MFA, editing and cancellation, and simultaneous attempts to reserve
the same staff timeslot.

### Upgrade

Deploy only tested commits:

```bash
git pull --ff-only
docker compose --env-file .env.production -f compose.production.yml up -d --build
```

Take a fresh DB backup before applying migrations. Keep an application rollback
plan compatible with the DB schema.

## 4. Mandatory encrypted offsite database backups

Use a separately managed storage provider and configure an encrypted
`rclone crypt` remote (example remote name: `vault:`) on the VPS host.
The backup helper **fails rather than silently succeeding** if the offsite
destination or rclone is absent:

```bash
BACKUP_TARGET='vault:serpente-db' bash deploy/vps/backup.sh
```

Schedule it daily using root's cron/systemd timer. Example crontab entry:

```cron
0 2 * * * cd /opt/nail_salon_api && BACKUP_TARGET='vault:serpente-db' /bin/bash deploy/vps/backup.sh >> /var/log/serpente-backup.log 2>&1
```

Backups are retained for 7 days locally; configure versioning/retention on the
remote independently. Periodically **restore an offsite dump into a temporary
DB and verify** data integrity. Volume persistence alone is not a backup.

## 5. Security and go-live checklist

- [ ] All production secrets set privately; `DB_SYNCHRONIZE=false`.
- [ ] Domain + valid HTTPS; restricted SSH; only ports 80/443 public.
- [ ] Offsite encrypted backup successfully taken **and restored**.
- [ ] MySQL migrated with consistent rows and foreign keys.
- [ ] Production Gmail OTP and admin login pass.
- [ ] Booking concurrency, staff assignment, cancellations and access roles pass.
- [ ] Website loads on Android/iOS and desktop with no horizontal overflow.
- [ ] Error monitoring, disk-space alerts and update process are in place.
- [ ] Keep Railway/Vercel as temporary fallback until verification is complete.
- [ ] Only then switch domain and stop paying for the old platform.

## Cost and reliability

A VPS is a **paid ongoing subscription**, not free forever. Prices vary by
region and provider; choose a plan you can renew. A single VPS is also a single
failure domain; the offsite backup and restore procedure are essential. An
Oracle Always Free ARM64 VM may run this architecture, but capacity and idle
resource reclamation make it a risky sole production host for a shop.
