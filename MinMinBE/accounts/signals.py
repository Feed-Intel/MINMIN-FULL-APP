# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User  # Use your actual User model path
from .utils import generate_and_send_otp_verification

@receiver(post_save, sender=User)
def handle_system_user_creation_otp(sender, instance, created, **kwargs):
    """
    Triggers OTP generation and email for system-created users (Admin, etc.).
    It is explicitly bypassed by the RegisterView using 'skip_otp_signal'.
    """
    
    if kwargs.pop('skip_otp_signal', False):
        return

    if not created:
        return

    if not instance.is_active and not instance.otp:
        generate_and_send_otp_verification(instance)