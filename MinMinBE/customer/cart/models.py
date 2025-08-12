from django.db import models
import uuid
from accounts.models import User
from restaurant.tenant.models import Tenant
from restaurant.menu.models import Menu

class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_carts')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tenant_carts')
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Cart {self.id} for Customer {self.customer.full_name}"
    
class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='cart_items')
    menu_item = models.ForeignKey(Menu, on_delete=models.CASCADE,default=None, related_name='menu_cart_items')
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"Item {self.id} in Cart {self.cart.id}"
