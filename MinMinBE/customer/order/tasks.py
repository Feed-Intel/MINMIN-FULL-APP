# restaurant/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Order

@shared_task
def check_pending_orders():
    # Get the current time
    now = timezone.now()
    # Calculate the time 15 minutes ago
    fifteen_minutes_ago = now - timedelta(minutes=7)
    # Get all orders with status 'placed' and created_at older than 15 minutes
    pending_orders = Order.objects.filter(status__in=['pending_payment', 'placed'], created_at__lte=fifteen_minutes_ago)
    # Update the status of these orders to 'cancelled'
    pending_orders.delete()