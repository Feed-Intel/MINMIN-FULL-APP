#!/usr/bin/env sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static..."
python manage.py collectstatic --noinput

echo "Ensuring superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
import os
User = get_user_model()
e = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
p = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'adminpass')
if not User.objects.filter(email=e).exists():
    User.objects.create_superuser(e, p)
print('Superuser ready:', e)
"

echo "Starting Gunicorn..."
exec gunicorn minminbe.wsgi:application -b 0.0.0.0:8000 --workers 3 --threads 2
