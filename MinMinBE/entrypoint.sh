#!/bin/sh
set -e

mkdir -p /app/media/images || true

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for Postgres..."
  # pg_isready and psql understand the standard postgresql scheme. Convert any
  # postgis:// URL so we can reuse the same connection string for both tools.
  DB_CHECK_URL="$(echo "$DATABASE_URL" | sed -e 's/^postgis:/postgresql:/')"
  until pg_isready -d "$DB_CHECK_URL" > /dev/null 2>&1; do
    sleep 1
  done

  echo "Ensuring PostGIS extension is installed..."
  # Using psql here avoids importing Django before the database schema exists
  # and guarantees the extension is created even if the database volume was
  # initialised without it.
  psql "$DB_CHECK_URL" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS postgis;"
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
