from django.db import models
from django.core.exceptions import ValidationError
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table
from restaurant.menu.models import Menu
from accounts.models import User
import uuid

class Order(models.Model):
    id = models.UUIDField(
        primary_key=True,  # Set as primary key
        default=uuid.uuid4,  # Default value is a new UUID
        editable=False,  # Prevent manual editing
        auto_created=True
    )
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tenant_order')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='branch_order')
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='table_order')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_order')
    order_id = models.CharField(max_length=50, editable=False, default="TEMP-ORDER-ID")
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    customer_phone = models.CharField(max_length=15, blank=True, null=True)
    customer_tinNo = models.TextField(blank=True, null=True)
    STATUS_TYPE_CHOICES = (  
        ('pending_payment', 'Pending Payment'),
        ('placed', 'Placed'),
        ('progress', 'Progress'),
        ('payment_complete', 'Payment Complete'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    status = models.CharField(max_length=30, choices=STATUS_TYPE_CHOICES, default='placed')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Generate the order_id only if it matches the default value or is empty
        if self.order_id == "TEMP-ORDER-ID":  
            # Construct the prefix using tenant's restaurant_name and branch's address
            tenant_prefix = self.tenant.restaurant_name[:5].upper().ljust(5, 'X')  # Pad with 'X' if less than 5 characters
            branch_prefix = self.branch.address[:5].upper().replace(" ", "").ljust(5, 'X')  # Pad with 'X' if less than 5 characters
            
            # Generate a unique sequence number for the branch
            sequence = Order.objects.filter(branch=self.branch).count() + 1
            
            # Combine into the final order_id
            self.order_id = f"{tenant_prefix}-{branch_prefix}-{sequence:04d}"
        
        super().save(*args, **kwargs)

    def calculate_total(self):
        return sum(item.get_total_price() for item in self.items.all())

    def delete(self, using=None, keep_parents=False):
        if self.payments.exists():
            raise ValidationError("This order cannot be deleted because it has related records.")
        return super().delete(using, keep_parents)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_id} - {self.status}"
    
class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    remarks = models.TextField(blank=True, null=True)
    def get_total_price(self):
        return self.quantity * self.price

    def __str__(self):
        return f"{self.quantity} x {self.menu_item}"


