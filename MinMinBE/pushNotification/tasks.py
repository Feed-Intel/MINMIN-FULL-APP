from celery import shared_task

from .utils import send_push_notification


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_push_notification_task(self, push_tokens, title, body):
    """Celery task to send push notifications asynchronously."""
    send_push_notification(push_tokens, title, body)

