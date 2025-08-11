import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alpha.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'info@feed-intel.com')
admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'secret')
admin_name = os.environ.get('DJANGO_SUPERUSER_NAME', 'Admin')

if not User.objects.filter(email=admin_email).exists():
    User.objects.create_superuser(email=admin_email, password=admin_password, full_name=admin_name)
    print('Admin user created.')
else:
    print('Admin user already exists.')
