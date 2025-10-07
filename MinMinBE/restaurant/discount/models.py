from django.db import models
from restaurant.tenant.models import Tenant
from django.core.exceptions import ValidationError
from restaurant.branch.models import Branch
from customer.order.models import Order
from accounts.models import User
import uuid

class Coupon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True,related_name='tenant_coupons')
    is_global = models.BooleanField(default=False)
    branches = models.ManyToManyField(Branch, blank=True, related_name='coupons')
    discount_code = models.CharField(max_length=255, null=True, blank=True)
    is_percentage = models.BooleanField(default=False)
    is_valid = models.BooleanField(default=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valid_from = models.DateTimeField(auto_now=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.discount_code or "Unnamed Coupon"

    class Meta:
        db_table = 'coupon'
        verbose_name_plural = 'coupons'

class CouponUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="usages")
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="coupon_usages")
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("coupon", "customer")  # ensures one use per customer


class Discount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True,related_name='tenant_discounts')
    is_global = models.BooleanField(default=False)
    branches = models.ManyToManyField(Branch, blank=True, related_name='discounts')
    name = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    TYPE_CHOICES = [
        ('volume', 'Volume'),
        ('combo', 'Combo'),
        ('bogo', 'BOGO'),
        ('freeItem', 'Free Item')
    ]
    
    type = models.CharField(
        max_length=255,
        choices=TYPE_CHOICES,
        default='volume'
    )
    off_peak_hours = models.BooleanField(default=False)
    priority = models.IntegerField(null=True, blank=True)
    is_stackable = models.BooleanField(default=False)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='coupon_discounts')
    valid_from = models.DateTimeField(auto_now=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, using=None, keep_parents=False):
        if (self.discount_discount_rules.exists() or 
            self.discount_discount_applications.exists()):
            raise ValidationError("This discount cannot be deleted because it has related records.")
        return super().delete(using, keep_parents)

    class Meta:
        db_table = 'discount'
        verbose_name_plural = 'discounts'



class DiscountRule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tenant_discount_rules')
    discount_id = models.ForeignKey(Discount, on_delete=models.CASCADE, related_name='discount_discount_rules')
    min_items = models.IntegerField(null=True, blank=True)
    min_price = models.DecimalField(max_digits=10, decimal_places=2,null=True, blank=True)
    applicable_items = models.JSONField(default=list)
    excluded_items = models.JSONField(default=list)
    combo_size = models.IntegerField(null=True, blank=True)
    buy_quantity = models.IntegerField(null=True, blank=True)
    get_quantity = models.IntegerField(null=True, blank=True)
    is_percentage = models.BooleanField(default=False)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2,default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'discount_rule'
        verbose_name_plural = 'discount_rules'


class DiscountApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE,related_name='order_discount_applications')
    discount = models.ForeignKey(Discount, on_delete=models.CASCADE,related_name='discount_discount_applications')
    applied_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'discount_application'
        verbose_name_plural = 'discount_applications'
