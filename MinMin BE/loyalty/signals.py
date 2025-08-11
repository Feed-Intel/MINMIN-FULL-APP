from django.db.models.signals import post_save
from django.dispatch import receiver
from customer.payment.models import Payment
from customer.order.models import Order
from customer.feedback.models import Feedback
from accounts.models import User
from .models import CustomerLoyalty, LoyaltyTransaction,TenantLoyalty,LoyaltyConversionRate,GlobalLoyaltySettings

@receiver(post_save, sender=Payment)
def handle_payment_loyalty(sender, instance, created, **kwargs):
    """
    Updates loyalty points when a payment is completed.
    """
    if created:  # Trigger only for newly created Payment instances
        customer = instance.order.customer
        tenant = instance.order.tenant
        settings, _ = GlobalLoyaltySettings.objects.get_or_create(event='payment', defaults={'global_points': 0})
        payment_points = settings.global_points

        # Update CustomerLoyalty
        customer_loyalty, _ = CustomerLoyalty.objects.get_or_create(customer=customer)
        customer_loyalty.global_points += payment_points* 0.01
        customer_loyalty.save()

        # Log the transaction
        LoyaltyTransaction.objects.create(
            tenant=tenant,
            customer=customer,
            points=payment_points,
            transaction_type="earning"
        )

@receiver(post_save, sender=Order)
def handle_order_completion_loyalty(sender, instance, created, **kwargs):
    """
    Updates loyalty points when an order is completed.
    """
    if instance.status == "delivered":  # Only for completed orders
        customer = instance.customer
        restaurant = instance.tenant
        order_total = instance.calculate_total()
        settings, _ = GlobalLoyaltySettings.objects.get_or_create(event='order', defaults={'global_points': 0})
        order_points= settings.global_points
        global_points = float(order_total) *float(order_points)* 0.01
        customer_loyalty, _ = CustomerLoyalty.objects.get_or_create(customer=customer)
        customer_loyalty.global_points += global_points
        customer_loyalty.save()

        LoyaltyTransaction.objects.create(
            tenant = restaurant,
            customer=customer,
            points=global_points,
            transaction_type="earning"
        )
        restaurant_rate = LoyaltyConversionRate.objects.get(tenant=restaurant).global_to_restaurant_rate  # Assuming a configurable field in the Restaurant model
        restaurant_points = float(order_total) * float(restaurant_rate)/100
        restaurant_loyalty, _ = TenantLoyalty.objects.get_or_create(
            customer=customer,
            tenant=restaurant
        )
        restaurant_loyalty.points += restaurant_points
        restaurant_loyalty.save()

        LoyaltyTransaction.objects.create(
            customer=customer,
            tenant=restaurant,
            points=restaurant_points,
            transaction_type="earning"
        )


@receiver(post_save, sender=User)
def handle_profile_completion_loyalty(sender, instance, **kwargs):
    """
    Awards loyalty points when a profile is completed.
    """
    if instance.phone and instance.birthday:  # Assuming `is_completed` indicates profile status
        customer = instance
        settings, _ = GlobalLoyaltySettings.objects.get_or_create(event='profile', defaults={'global_points': 0})
        profile_completion_points = settings.global_points
        customer_loyalty, _ = CustomerLoyalty.objects.get_or_create(customer=customer)
        customer_loyalty.global_points += profile_completion_points
        customer_loyalty.save()
        if instance.user_type != 'branch':
            LoyaltyTransaction.objects.create(
                customer=customer,
                tenant=None,
                points=profile_completion_points,
                transaction_type="earning"
            )

@receiver(post_save, sender=Feedback)
def handle_feedback_completion_loyalty(sender, instance, created, **kwargs):
    """
    Awards loyalty points when feedback is submitted.
    """
    if created:  # Trigger only for new feedback submissions
        customer = instance.customer

        # Fixed bonus for feedback completion
        settings, _ = GlobalLoyaltySettings.objects.get_or_create(event='feedback', defaults={'global_points': 0})
        feedback_points = settings.global_points
        customer_loyalty, _ = CustomerLoyalty.objects.get_or_create(customer=customer)
        customer_loyalty.global_points += feedback_points
        customer_loyalty.save()

        LoyaltyTransaction.objects.create(
            customer=customer,
            tenant=instance.order.tenant,
            points=feedback_points,
            transaction_type="earning"
        )
