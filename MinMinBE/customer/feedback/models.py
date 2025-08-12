from django.db import models
from accounts.models import User
from customer.order.models import Order
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator

class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_feedbacks')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_feedbacks', null=True, blank=True)
    
    # New Fields for Menu & Restaurant Feedback
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='menu_feedbacks', null=True, blank=True)
    restaurant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='restaurant_feedbacks', null=True, blank=True)

    # Ratings (Now using IntegerField for validation)
    service_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    food_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    wait_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    overall_rating = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)])

    # Comment
    comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback by {self.customer.full_name}"

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['order'], name='unique_feedback_per_order')
        ]

