from __future__ import annotations

"""Utility helpers for working with account-related access scopes."""

from typing import Optional

from accounts.models import User
from restaurant.branch.models import Branch
from restaurant.tenant.models import Tenant


def get_user_branch(user: User) -> Optional[Branch]:
    """Return the branch linked to the given user if available."""
    return getattr(user, "branch", None)


def get_user_tenant(user: User) -> Optional[Tenant]:
    """Return the tenant the user can administer or belongs to."""
    if user.user_type == "restaurant":
        return getattr(user, "tenants", None)

    if user.user_type == "branch":
        branch = get_user_branch(user)
        return branch.tenant if branch else None

    return None


# accounts/utils.py

import random
import logging
from hashlib import sha256
from django.core.mail import send_mail
from django.utils.timezone import now, timedelta
from django.conf import settings
from .models import User # Ensure your User model is imported

logger = logging.getLogger(__name__)

def generate_and_send_otp_verification(user):
    """
    Generates an OTP, saves the hashed version and expiry to the user,
    ensures is_active=False, and attempts to send the email.
    """
    if not user.email:
        logger.warning(f"Cannot send OTP: User ID {user.id} has no email.")
        return False, "User has no email address."
        
    otp = str(random.randint(100000, 999999))
    email = user.email

    try:
        send_mail(
            subject="Your OTP for Registration/Verification",
            message=f"Your OTP is {otp}. It is valid for 10 minutes.",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {e}")
        return False, "Could not send OTP email. Please check server logs."

    user.otp = sha256(otp.encode()).hexdigest()
    user.otp_expiry = now() + timedelta(minutes=10)
    user.is_active = False 
    user.save(update_fields=["otp", "otp_expiry", "is_active"])

    logger.info(f"Successfully generated and sent OTP to {email} by system.")
    return True, None
