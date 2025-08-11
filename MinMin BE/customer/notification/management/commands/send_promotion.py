from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from notification.models import Notification
from accounts.models import User

class Command(BaseCommand):
    help = "Send promotional notifications to customers"

    def handle(self, *args, **kwargs):
        customers = User.objects.filter(opt_in_promotions=True)
        promotion_message = "Check out our latest discounts and offers!"

        for customer in customers:
            # Create an in-app notification
            if customer.enable_in_app_notifications:
                Notification.objects.create(
                    customer=customer,
                    message=promotion_message,
                    notification_type='Promotion'
                )
            
            # Send email notification
            if customer.enable_email_notifications:
                send_mail(
                    "Exclusive Discounts and Promotions!",
                    promotion_message,
                    "info@feed-intel.com",
                    [customer.email]
                )

        self.stdout.write(self.style.SUCCESS("Promotional notifications sent successfully!"))
