from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PushNotification
from .utils import send_push_notification
from accounts.models import User

@receiver(post_save, sender=PushNotification)
def handle_push_notification(sender, instance, created, **kwargs):
    """
    Sends a push notification to all users subscribed to the topic.
    """
    push_tokens = User.objects.filter(push_token__isnull=False).values_list('push_token', flat=True)
    if created:
        send_push_notification(push_tokens,instance.title, instance.message)    