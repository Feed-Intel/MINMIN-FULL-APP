from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from .models import User
class MySocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        if not sociallogin.user.email:
            return

        # Check if user exists and link account
        try:
            user = User.objects.get(email=sociallogin.user.email)
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            pass  # No existing user, continue with the normal flow

    def save_user(self, request, sociallogin, form=None):
        user = sociallogin.user
        user.is_active = True
        if not user.phone:
            user.phone = f"phone_{user.id}"[:15]
        if not user.pk:
            user.save()
        return user
