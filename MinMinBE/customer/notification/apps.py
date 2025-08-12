from django.apps import AppConfig


class NotificationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "customer.notification"

    def ready(self):
        import customer.notification.signals