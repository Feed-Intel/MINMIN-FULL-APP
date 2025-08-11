from django.db import models
from uuid import uuid4
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.menu.models import Menu

class Combo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(max_length=255)  # Combo name
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='combos'
    )  # Foreign Key to Tenant
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='branch_combos'
    )
    is_custom = models.BooleanField(default=False)  # Indicates if customer-created
    combo_price = models.DecimalField(max_digits=10, decimal_places=2)  # Fixed price for the combo
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp of creation

    def __str__(self):
        return f"Combo: {self.name} - ${self.combo_price}"


class ComboItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    combo = models.ForeignKey(
        Combo,
        on_delete=models.CASCADE,
        related_name='combo_items'
    )  # Foreign Key to Combo
    menu_item = models.ForeignKey(
        Menu,
        on_delete=models.CASCADE,
        related_name='combo_items'
    )  # Foreign Key to Menu
    quantity = models.PositiveIntegerField(default=1)  # Quantity of menu item
    is_half = models.BooleanField(default=False)  # Indicates if half-and-half is allowed

    def __str__(self):
        return f"ComboItem: {self.menu_item.name} x{self.quantity}"
