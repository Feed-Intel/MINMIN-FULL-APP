from django.db import models
from accounts.models import User
from restaurant.tenant.models import Tenant
import uuid

class GlobalLoyaltySettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    EVENT_CHOICES = (("payment","Payment"),("order","Order"),("feedback","Feedback"),("profile","Profile"))
    event = models.CharField(max_length=255, choices= EVENT_CHOICES,blank=True, null=True,unique=True)
    global_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.event

class RestaurantLoyaltySettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,related_name='restaurant_loyalty_settings')
    threshold = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.tenant.restaurant_name

class CustomerLoyalty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE,related_name='customer_loyalty')
    global_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.customer.email

    
class TenantLoyalty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,related_name='tenant_loyalty')
    customer = models.ForeignKey(User, on_delete=models.CASCADE,related_name='tenant_customer_loyalty')
    points = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.tenant.restaurant_name
    

    
class LoyaltyTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,null=True,blank=True,related_name='tenant_customer_loyalty_transaction')
    customer = models.ForeignKey(User, on_delete=models.CASCADE,related_name='tenant_customer_loyalty_transaction')
    points = models.FloatField(default=0.0)
    TRANSACTION_CHOICE = (("redemption","Redemption"),( "earning","Earning"))
    transaction_type = models.CharField(max_length=255, choices= TRANSACTION_CHOICE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.tenant.restaurant_name

class LoyaltyConversionRate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,related_name='tenant_loyalty_conversion_rate')
    global_to_restaurant_rate = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.tenant.restaurant_name