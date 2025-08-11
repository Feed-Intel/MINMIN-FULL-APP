from django.apps import AppConfig


class MenuConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "restaurant.menu"

    def ready(self):
        import restaurant.menu.signals
