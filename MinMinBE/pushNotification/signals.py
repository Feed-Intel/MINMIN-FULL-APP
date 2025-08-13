from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import User
from .models import PushNotification
from .tasks import send_push_notification_task

@receiver(post_save, sender=PushNotification)
def handle_push_notification(sender, instance, created, **kwargs):
    """
    Sends a push notification to all users subscribed to the topic.
    """
    push_tokens = list(
        User.objects.filter(push_token__isnull=False).values_list("push_token", flat=True)
    )
    if created:
        send_push_notification_task.delay(push_tokens, instance.title, instance.message)