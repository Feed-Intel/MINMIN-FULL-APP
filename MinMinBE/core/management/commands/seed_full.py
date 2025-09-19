from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings


class Command(BaseCommand):
    help = "Seed the database with full demo data (restaurants + customers). Idempotent where possible."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-restaurants",
            action="store_true",
            help="Skip seeding restaurant-related data",
        )
        parser.add_argument(
            "--no-customers",
            action="store_true",
            help="Skip seeding customer-related data",
        )

    def handle(self, *args, **options):
        # Set safe seed-time settings to avoid external side effects
        original_email_backend = getattr(settings, "EMAIL_BACKEND", None)
        original_channel_layers = getattr(settings, "CHANNEL_LAYERS", None)
        settings.EMAIL_BACKEND = "django.core.mail.backends.dummy.EmailBackend"
        settings.CHANNEL_LAYERS = {
            "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
        }
        no_restaurants = options.get("no_restaurants", False)
        no_customers = options.get("no_customers", False)

        if not no_restaurants:
            self.stdout.write(self.style.NOTICE("Seeding restaurant data..."))
            call_command("seed_restaurant_data")

        if not no_customers:
            self.stdout.write(self.style.NOTICE("Seeding customer data..."))
            call_command("seed_customers")

        # Restore settings
        if original_email_backend is not None:
            settings.EMAIL_BACKEND = original_email_backend
        if original_channel_layers is not None:
            settings.CHANNEL_LAYERS = original_channel_layers

        self.stdout.write(self.style.SUCCESS("Seeding completed."))
