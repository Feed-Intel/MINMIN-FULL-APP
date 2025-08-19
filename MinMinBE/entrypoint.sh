#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for Postgres..."
  # pg_isready does not understand the "postgis" scheme, so replace it
  # with the standard postgres scheme before checking connectivity.
  DB_CHECK_URL="${DATABASE_URL/postgis/postgres}"
  until pg_isready -d "$DB_CHECK_URL" > /dev/null 2>&1; do
    sleep 1
  done
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
