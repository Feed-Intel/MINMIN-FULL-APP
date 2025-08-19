#!/usr/bin/env sh
set -e

echo "Configuring nginx hash sizes..."
if [ -f /etc/nginx/nginx.conf ]; then
  sed -i '/http {/a \    types_hash_max_size 2048;\n    types_hash_bucket_size 128;' /etc/nginx/nginx.conf
  echo "Nginx config tuned."
else
  echo "Nginx not installed or /etc/nginx/nginx.conf missing, skipping nginx tuning."
fi

echo "Ensuring PostGIS extension..."
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS postgis;" || \
  echo "PostGIS creation skipped (psql not available or DB not reachable)."

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
exec gunicorn minminbe.wsgi:application \
    -b 0.0.0.0:8000 \
    --workers 3 \
    --threads 2 \
    --timeout 60
