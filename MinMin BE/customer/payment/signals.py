from django.db.models.signals import post_save, post_delete
from alpha.settings import EMAIL_HOST_USER
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Payment
from customer.notification.models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Payment)
def handle_payment_save(sender, instance, created, **kwargs):
    """
    Signal triggered when a Payment is created or updated.
    """
    if created:
        # Notify the customer when a payment is initiated
        customer_email = instance.order.customer.email
        message = (
            f"Dear {instance.order.customer.email},\n\n"
            f"Your payment of ${instance.amount_paid} for Order ID: {instance.order.id} "
            f"has been successfully initiated. The current status is: {instance.payment_status}.\n\n"
            f"Payment Method: {instance.payment_method}\n"
            f"Transaction ID: {instance.transaction_id or 'N/A'}\n\n"
            f"Thank you for your payment!\n"
            f"Best Regards,\nAlpha Team"
        )
        send_mail(
            "Payment Initiated",
            message,
            EMAIL_HOST_USER,
            [customer_email]
        )
        
        # Create an in-app notification
        Notification.objects.create(
            customer=instance.order.customer,
            message=f"Payment of ${instance.amount_paid} for Order ID {instance.order.id} is initiated.",
            notification_type="Payment Created"
        )

    else:
        # Notify the customer on payment status update
        if instance.payment_status == 'completed':
            status_message = (
                f"Dear {instance.order.customer.email},\n\n"
                f"Your payment of ${instance.amount_paid} for Order ID: {instance.order.id} has been completed successfully.\n\n"
                f"Transaction ID: {instance.transaction_id}\n"
                f"Thank you for your business!\n\n"
                f"Best Regards,\nAlpha Team"
            )
            channel_layer = get_channel_layer()
            group_name = str(instance.order.tenant.id)  # Specific branch group
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_restaurant_notification",
                    "message": {
                        "type": "Payment Completed",
                        "branch": str(instance.order.branch.id),
                        "message": f"Payment of ${instance.amount_paid} for Order ID {instance.order.id} has been completed successfully."
                    }
                }
            )
            user_group = f'{instance.order.customer.id}'
            async_to_sync(channel_layer.group_send)(
                user_group,
                {
                    "type": "send_user_notification",
                    "message": {
                        "type": "Payment Completed",
                        "message": f"Payment of ${instance.amount_paid} for Order ID {instance.order.id} has been completed successfully."
                    }
                }
            )
        elif instance.payment_status == 'failed':
            status_message = (
                f"Dear {instance.order.customer.email},\n\n"
                f"Your payment of ${instance.amount_paid} for Order ID: {instance.order.id} has failed.\n\n"
                f"Please try again or contact support for assistance.\n\n"
                f"Best Regards,\nAlpha Team"
            )
            channel_layer = get_channel_layer()
            group_name = str(instance.order.tenant.id)  # Specific branch group
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_restaurant_notification",
                    "message": {
                        "type": "Payment Failed",
                        "branch": str(instance.order.branch.id),
                        "message": f"Payment of ${instance.amount_paid} for Order ID {instance.order.id} has failed."
                    }
                }
            )
            user_group = f'{instance.order.customer.id}'
            async_to_sync(channel_layer.group_send)(
                user_group,
                {
                    "type": "send_user_notification",
                    "message": {
                        "type": "Payment Failed",
                        "message": f"Payment of ${instance.amount_paid} for Order ID {instance.order.id} has failed."
                    }
                }
            )
        else:
            # For pending or other statuses
            status_message = (
                f"Dear {instance.order.customer.email},\n\n"
                f"The status of your payment for Order ID: {instance.order.id} has been updated to: {instance.payment_status}.\n\n"
                f"Best Regards,\nAlpha Team"
            )

        # Send status update email to the customer
        send_mail(
            "Payment Status Update",
            status_message,
            EMAIL_HOST_USER,
            [instance.order.customer.email]
        )
        
        # Create an in-app notification
        Notification.objects.create(
            customer=instance.order.customer,
            message=f"Payment for Order ID {instance.order.id} is now {instance.payment_status}.",
            notification_type="Payment Status Updated"
        )

@receiver(post_delete, sender=Payment)
def handle_payment_delete(sender, instance, **kwargs):
    """
    Signal triggered when a Payment is deleted.
    """
    # Notify admin when a payment record is deleted
    admin_email = "admin@yourdomain.com"  # Update with your admin email
    admin_message = (
        f"Payment ID: {instance.id} has been deleted.\n\n"
        f"Order ID: {instance.order.id}\n"
        f"Customer: {instance.order.customer.email}\n"
        f"Amount: ${instance.amount_paid}\n"
        f"Payment Method: {instance.payment_method}\n"
        f"Deleted at: {instance.updated_at}\n\n"
        f"Please review if this action was intended.\n\n"
        f"Best Regards,\nYour System"
    )
    send_mail(
        "Payment Deleted",
        admin_message,
        EMAIL_HOST_USER,
        [admin_email]
    )
    
    # Optionally create an in-app notification for admins
    Notification.objects.create(
        customer=None,  # Assuming null for system notifications
        message=f"Payment ID {instance.id} for Order ID {instance.order.id} has been deleted.",
        notification_type="Payment Deleted"
    )
