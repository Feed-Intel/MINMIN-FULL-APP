from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from customer.order.models import Order

@receiver(post_save, sender=Order)
def send_order_status_notification(sender, instance, created, **kwargs):
    if not created:  # Only trigger on updates
        message = f"Your order status has been updated to: {instance.status}."
        
        # Create an in-app notification
        if instance.customer.enable_in_app_notifications:
            Notification.objects.create(
                customer=instance.customer,
                message=message,
                notification_type='Order Update'
            )
        
        # Send email notification
        if instance.customer.enable_email_notifications:
            from django.core.mail import send_mail
            send_mail(
                "Order Status Update",
                message,
                "info@feed-intel.com",
                [instance.customer.email]
            )
