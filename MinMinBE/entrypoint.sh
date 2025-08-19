#!/usr/bin/env sh
set -e

# Make sure Django can find its settings
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-minminbe.settings}"
export PYTHONPATH="/app:${PYTHONPATH:-}"

echo "Checking database backend..."
python - <<'PY'
import os, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE",
                      os.environ.get("DJANGO_SETTINGS_MODULE","minminbe.settings"))
try:
    import django
    django.setup()
    from django.conf import settings
    engine = settings.DATABASES['default']['ENGINE']
    print("DB ENGINE:", engine)
    if engine == "django.db.backends.sqlite3":
        sys.stderr.write(
            "\nERROR: SQLite backend detected. GeoDjango fields require PostGIS or Spatialite.\n"
            "Use ENGINE 'django.contrib.gis.db.backends.postgis' and set DB_* env vars.\n"
        )
        sys.exit(1)
except Exception as e:
    sys.stderr.write(f"Startup check failed: {e!r}\n")
    sys.exit(1)
PY

echo "Ensuring PostGIS extension (if possible)..."
if command -v psql >/dev/null 2>&1; then
  if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS postgis;" \
      || echo "PostGIS create skipped (rights/connection)."
  elif [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
    PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "${DB_PORT:-5432}" \
      -c "CREATE EXTENSION IF NOT EXISTS postgis;" \
      || echo "PostGIS create skipped (rights/connection)."
  else
    echo "No DB connection info; skipping PostGIS creation."
  fi
else
  echo "psql not available; skipping PostGIS creation."
fi

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static..."
python manage.py collectstatic --noinput 


echo "Ensuring superuser..."
python manage.py shell <<'EOF'
from django.contrib.auth import get_user_model
import os
User = get_user_model()
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'adminpass')
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password)
print("Superuser ready:", email)
EOF

echo "Starting Gunicorn..."
exec "$@"
