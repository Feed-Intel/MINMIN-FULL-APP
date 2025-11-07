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
        parser.add_argument(
            "--restaurants",
            type=int,
            help="Override the number of restaurants to create",
        )
        parser.add_argument(
            "--restaurant-branches",
            dest="restaurant_branches",
            type=int,
            help="Override the number of branches per restaurant",
        )
        parser.add_argument(
            "--restaurant-tables",
            dest="restaurant_tables",
            type=int,
            help="Override the number of tables per branch",
        )
        parser.add_argument(
            "--restaurant-menus",
            dest="restaurant_menus",
            type=int,
            help="Override the number of menu items per restaurant",
        )
        parser.add_argument(
            "--restaurant-customers",
            dest="restaurant_customers",
            type=int,
            help="Override the number of customers created alongside restaurants",
        )
        parser.add_argument(
            "--restaurant-orders",
            dest="restaurant_orders",
            type=int,
            help="Override the number of orders per restaurant customer",
        )
        parser.add_argument(
            "--feed-posts-per-tenant",
            type=int,
            help="Override the number of feed posts per restaurant admin",
        )
        parser.add_argument(
            "--menu-availability-ratio",
            type=float,
            help="Set the probability that a menu item is marked available per branch (0-1)",
        )
        parser.add_argument(
            "--payments-per-order",
            type=int,
            help="Override how many payments are attached to each seeded order",
        )
        parser.add_argument(
            "--customer-count",
            type=int,
            help="Override the number of customers to create when seeding customer data",
        )
        parser.add_argument(
            "--addresses-per-customer",
            type=int,
            help="Override how many addresses to attach to each customer",
        )
        parser.add_argument(
            "--orders-per-customer",
            type=int,
            help="Override how many orders to create per customer",
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
        restaurant_seed_kwargs = {
            key: value
            for key, value in (
                ("restaurants", options.get("restaurants")),
                ("branches", options.get("restaurant_branches")),
                ("tables", options.get("restaurant_tables")),
                ("menus", options.get("restaurant_menus")),
                ("customers", options.get("restaurant_customers")),
                ("orders", options.get("restaurant_orders")),
                ("feed_posts_per_tenant", options.get("feed_posts_per_tenant")),
                ("menu_availability_ratio", options.get("menu_availability_ratio")),
                ("payments_per_order", options.get("payments_per_order")),
            )
            if value is not None
        }
        customer_seed_kwargs = {
            key: value
            for key, value in (
                ("customer_count", options.get("customer_count")),
                ("addresses_per_customer", options.get("addresses_per_customer")),
                ("orders_per_customer", options.get("orders_per_customer")),
            )
            if value is not None
        }

        if not no_restaurants:
            self.stdout.write(self.style.NOTICE("Seeding restaurant data..."))
            call_command("seed_restaurant_data", **restaurant_seed_kwargs)

        if not no_customers:
            self.stdout.write(self.style.NOTICE("Seeding customer data..."))
            call_command("seed_customers", **customer_seed_kwargs)

        # Restore settings
        if original_email_backend is not None:
            settings.EMAIL_BACKEND = original_email_backend
        if original_channel_layers is not None:
            settings.CHANNEL_LAYERS = original_channel_layers

        self.stdout.write(self.style.SUCCESS("Seeding completed."))
