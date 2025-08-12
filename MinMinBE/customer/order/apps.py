from django.apps import AppConfig


class OrderConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "customer.order"

    def ready(self):
        import customer.order.signals