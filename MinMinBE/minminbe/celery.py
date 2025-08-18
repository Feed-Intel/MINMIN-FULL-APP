from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'minminbe.settings')

app = Celery("minminbe")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-pending-orders-every-minute': {
        'task': 'restaurant.tasks.check_pending_orders',
        'schedule': crontab(minute='*/1'),  # Run every 60 seconds
    },
}