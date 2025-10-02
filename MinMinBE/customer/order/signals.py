from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.mail import send_mail
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order
from customer.notification.models import Notification
from minminbe.settings import EMAIL_HOST_USER

@receiver(post_save, sender=Order)
def handle_order_save(sender, instance, created, **kwargs):
    """
    Signal triggered when an Order is created or updated.
    """
    channel_layer = get_channel_layer()
    group_name = str(instance.customer.id)
    tenant = str(instance.tenant.id)
    def send_created_notifications():
        message = (
            f"Dear {instance.customer.email},\n\n"
            f"Your order has been successfully placed.\n"
            f"Order ID: {instance.order_id}\n"
            f"Total Price: ${instance.calculate_total()}\n"
            f"Thank you for choosing us!\n\n"
            f"Best Regards,\nMinminbe Team"
        )
        send_mail(
            "Order Placed Successfully",
            message,
            EMAIL_HOST_USER,
            [instance.customer.email]
        )
        
        # Create an in-app notification
        Notification.objects.create(
            customer=instance.customer,
            message=f"Your order (ID: {instance.order_id}) has been placed successfully.",
            notification_type="Order Created"
        )
        
        # Notify WebSocket group
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_user_notification',
                "message": {
                    "type": "Order Created",
                    "message": f"Order {instance.order_id} have been created"
                }
            }
        )
        
        async_to_sync(channel_layer.group_send)(
            tenant,
            {
                'type': 'send_restaurant_notification',
                "message": {
                    "type": "Order Created",
                    "message": f"Order {instance.order_id} have been created"
                }
            }
        )

    if created:
        # Notify customer on order creation
        transaction.on_commit(send_created_notifications)
    else:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_user_notification',
                "message": {
                    "type": "Order Update",
                    "message": f"Order {instance.order_id} have been updated to {instance.status}"
                }
            }
        )

        async_to_sync(channel_layer.group_send)(
            tenant,
            {
                'type': 'send_restaurant_notification',
                "message": {
                    "type": "Order Update",
                    "message": f"Order {instance.order_id} have been updated to {instance.status}"
                }
            }
        )
        # Notify customer on order status update
        status_message = (
            f"Dear {instance.customer.full_name},\n\n"
            f"The status of your order (ID: {instance.order_id}) has been updated to: {instance.status}.\n\n"
            f"Best Regards,\nMinminbe Team"
        )
        send_mail(
            "Order Status Update",
            status_message,
            EMAIL_HOST_USER,
            [instance.customer.email]
        )
        
        # Create an in-app notification
        Notification.objects.create(
            customer=instance.customer,
            message=f"Your order (ID: {instance.order_id}) status has been updated to: {instance.status}.",
            notification_type="Order Updated"
        )
        

@receiver(post_delete, sender=Order)
def handle_order_delete(sender, instance, **kwargs):
    """
    Signal triggered when an Order is deleted.
    """
    channel_layer = get_channel_layer()
    group_name = str(instance.customer.id)
    tenant = str(instance.tenant.id)

    # Notify admin on order deletion
    admin_message = (
        f"Order ID: {instance.order_id} has been deleted.\n\n"
        f"Customer: {instance.customer.email}\n"
        f"Total Price: ${instance.calculate_total()}\n"
        f"Status: {instance.status}\n"
        f"Deleted at: {instance.updated_at}\n\n"
        f"Best Regards,\nYour System"
    )
    send_mail(
        "Order Deleted",
        admin_message,
        EMAIL_HOST_USER,
        ["admin@yourdomain.com"]  # Update to your admin email
    )
    
    # Optionally create an in-app notification for admin
    Notification.objects.create(
        customer=None,  # Assuming null for system notifications
        message=f"Order ID: {instance.order_id} has been deleted.",
        notification_type="Order Deleted"
    )
    
    # Notify WebSocket group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_user_notification',
            'action': 'delete',
            'status': 'deleted',
            'order_id': str(instance.id)
        }
    )

    async_to_sync(channel_layer.group_send)(
            tenant,
            {
                'type': 'send_restaurant_notification',
                "message": {
                    "type": "Order Update",
                    "message": f"Order {instance.order_id} have been updated to {instance.status}"
                }
            }
        )