#!/usr/bin/env bash
# Daily encrypted offsite MySQL backup. Requires rclone remote configured on host.
set -euo pipefail
umask 077

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/compose.production.yml"
ENV_FILE="$ROOT_DIR/.env.production"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
BACKUP_TARGET="${BACKUP_TARGET:-}"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing .env.production" >&2; exit 1
fi
if [[ -z "$BACKUP_TARGET" ]]; then
    echo "Set BACKUP_TARGET to an encrypted offsite rclone remote, e.g. vault:serpente-db" >&2
    exit 1
fi
command -v rclone >/dev/null || { echo "rclone is required" >&2; exit 1; }
command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
name="serpente-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
tmp="$BACKUP_DIR/.$name.tmp"
trap 'rm -f "$tmp"' EXIT

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
    sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --single-transaction --quick --routines --triggers --events --set-gtid-purged=OFF --no-tablespaces -u"$MYSQL_USER" "$MYSQL_DATABASE"' \
    | gzip -c > "$tmp"
test -s "$tmp"
gzip -t "$tmp"
mv "$tmp" "$BACKUP_DIR/$name"
rclone copyto "$BACKUP_DIR/$name" "${BACKUP_TARGET%/}/$name"
echo "Verified and uploaded offsite: $name"

# Keep 7 days locally. Offsite retention is configured independently.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'serpente-*.sql.gz' -mtime +7 -delete
