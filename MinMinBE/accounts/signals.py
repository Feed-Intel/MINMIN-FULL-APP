# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password
import string
import random
from minminbe.settings import EMAIL_HOST_USER
from .models import User

@receiver(post_save, sender=User)
def handle_system_user_otp_verification(sender, instance, created, **kwargs):
    """
    Triggers OTP generation and email for system-created users (Admin, etc.).
    It is explicitly bypassed by the RegisterView using 'skip_otp_signal'.
    """
    if kwargs.get('skip_otp_signal', False):
        return

    if not created:
        return
    

    if instance.user_type in ['branch', 'restaurant']:
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        generated_password = make_password(temp_password)
        is_active = True
        send_mail(
            subject='Account Created and Credentials',
            message=f'Your {instance.full_name} account has been created. Your Login Credentials are: Email: {instance.email}, Password: {temp_password}.',
            from_email=EMAIL_HOST_USER,
            recipient_list=[instance.email],
            fail_silently=False,
        )
        instance.password = generated_password
        instance.is_active = is_active
        instance.otp = None
        instance.otp_expiry = None
        instance.save()