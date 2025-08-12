from django.db import models
from accounts.models import User
import uuid

class Address(models.Model):
    LABEL_CHOICES = (
        ('home', 'Home'),
        ('office', 'Office'),
        ('other', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    address_line = models.TextField()
    gps_coordinates = models.CharField(max_length=255)
    label = models.CharField(max_length=10, choices=LABEL_CHOICES, default='home')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'label')  # One label type per user

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.address_line} ({self.label})"