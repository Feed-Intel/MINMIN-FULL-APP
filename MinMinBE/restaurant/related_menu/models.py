from django.db import models
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant
from uuid import uuid4
from django.utils.translation import gettext_lazy as _

class RelatedMenuItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        null=True,
        related_name='tenant_related_menu_items'
    )  # Foreign Key to Tenant
    menu_item = models.ForeignKey(
        Menu,
        on_delete=models.CASCADE,
        related_name='related_menu_items',
        null=True
    )  # Foreign Key to Menu (related to menu items)
    related_item = models.ForeignKey(
        Menu,
        on_delete=models.CASCADE,
        related_name='related_items',
        null=True
    )  # Foreign Key to Menu (related to other menu items)
    tag = models.CharField(max_length=255, choices=(
        ('Best Paired With', 'Best Paired With'),
        ('Alternative', 'Alternative'),
        ('Customer Favorite', 'Customer Favorite'),
    ))
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp for creation
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp for updates

    class Meta:
        unique_together = ('menu_item', 'related_item', 'tenant')  # Ensure uniqueness

    def __str__(self):
        return f"{self.menu_item.name} - {self.related_item.name} ({self.tag})"
