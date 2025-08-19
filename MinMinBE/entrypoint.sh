#!/usr/bin/env sh
set -e

echo "Checking database backend…"
python - <<'PY'
import os, sys
from django.conf import settings
import django
django.setup()
engine = settings.DATABASES['default']['ENGINE']
print("DB ENGINE:", engine)
# Fail fast if GIS fields would hit sqlite
if engine == "django.db.backends.sqlite3":
    sys.stderr.write(
        "\nERROR: SQLite backend detected. GeoDjango fields require PostGIS or Spatialite.\n"
        "Set DB_* env vars in EB and use 'django.contrib.gis.db.backends.postgis'.\n\n"
    )
    sys.exit(1)
PY

# Optional: try to create PostGIS extension if we have psql and superuser rights.
# Uses either DATABASE_URL or discrete DB_* vars.
echo "Ensuring PostGIS extension (if possible)…"
if command -v psql >/dev/null 2>&1; then
  if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS postgis;" || echo "PostGIS create skipped (insufficient rights or already exists)."
  elif [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
    PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "${DB_PORT:-5432}" \
      -c "CREATE EXTENSION IF NOT EXISTS postgis;" || echo "PostGIS create skipped (insufficient rights or already exists)."
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
