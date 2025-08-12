from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Feedback
from django.core.mail import send_mail

@receiver(post_save, sender=Feedback)
def handle_feedback_save(sender, instance, created, **kwargs):
    """
    Signal triggered when a Feedback is created or updated.
    """
    if created:
        # New feedback created
        message = (
            f"Dear {instance.customer.full_name},\n\n"
            f"Thank you for providing your feedback for order {instance.order.id}. "
            f"We greatly value your input.\n\n"
            f"Your Rating: {instance.overall_rating}\n"
            f"Your Message: {instance.service_rating}\n\n"
            f"Best Regards,\nAlpha Team"
        )
        
        # Send email to the customer
        send_mail(
            "Thank You for Your Feedback",
            message,
            "info@feed-alpha.com",
            [instance.customer.email]
        )
        
        # Send email to admin
        admin_message = (
            f"New feedback has been submitted:\n\n"
            f"Customer: {instance.customer.email}\n"
            f"Order: {instance.order.id}\n"
            f"Rating: {instance.overall_rating}\n"
            f"Message: {instance.service_rating}\n\n"
        )
        send_mail(
            "New Feedback Submitted",
            admin_message,
            "noreply@yourdomain.com",
            ["admin@yourdomain.com"]
        )
    else:
        # Feedback updated
        message = (
            f"Dear {instance.customer.full_name},\n\n"
            f"Your feedback for order {instance.order.id} has been updated.\n\n"
            f"Updated Rating: {instance.overall_rating}\n"
            f"Updated Message: {instance.service_rating}\n\n"
            f"Best Regards,\nAlpha Team"
        )
        
        # Send email to the customer
        send_mail(
            "Your Feedback Has Been Updated",
            message,
            "noreply@yourdomain.com",
            [instance.customer.email]
        )

@receiver(post_delete, sender=Feedback)
def handle_feedback_delete(sender, instance, **kwargs):
    """
    Signal triggered when a Feedback is deleted.
    """
    admin_message = (
        f"The following feedback has been deleted:\n\n"
        f"Customer: {instance.customer.email if instance.customer else 'N/A'}\n"
        f"Order: {instance.order.id if instance.order else 'N/A'}\n"
        f"Rating: {instance.overall_rating}\n"
        f"Message: {instance.service_rating}\n\n"
    )
    
    # Notify admin
    send_mail(
        "Feedback Deleted",
        admin_message,
        "noreply@yourdomain.com",
        ["admin@yourdomain.com"]
    )
