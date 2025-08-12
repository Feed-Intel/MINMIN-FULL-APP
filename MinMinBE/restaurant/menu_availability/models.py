from django.db import models
from restaurant.branch.models import Branch
from restaurant.menu.models import Menu
from uuid import uuid4

class MenuAvailability(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='branch_menu_availabilities'
    )  # Foreign Key to Branch
    menu_item = models.ForeignKey(
        Menu,
        on_delete=models.CASCADE,
        related_name='menu_items_availabilities',
    )  # Foreign Key to Menu
    is_available = models.BooleanField(default=True,db_index=True)  # Default availability
    special_notes = models.TextField(null=True, blank=True)  # Optional notes
    created_at = models.DateTimeField(auto_now_add=True,db_index=True)  # Timestamp for creation
    updated_at = models.DateTimeField(auto_now=True,db_index=True)  # Timestamp for changes

    class Meta:
        # Add a unique constraint if (menu_item, branch) should be unique
        unique_together = ('menu_item', 'branch') 
        # You might also want to add indexes on foreign keys explicitly if not already covered
        # indexes = [
        #     models.Index(fields=['menu_item']),
        #     models.Index(fields=['branch']),
        # ]

    def __str__(self):
        return f"{self.menu_item.name} at {self.branch.name} - Available: {self.is_available}"