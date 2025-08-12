from django.db import models
from accounts.models import User
import uuid

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='notifications')
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50,
        choices=[
            ('Order Update', 'Order Update'),
            ('Promotion', 'Promotion')
        ]
    )
    is_read = models.BooleanField(default=False)  # For tracking read/unread status
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification for {self.message}"
