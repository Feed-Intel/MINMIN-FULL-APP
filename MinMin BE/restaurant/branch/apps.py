from django.apps import AppConfig


class BranchConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "restaurant.branch"

    def ready(self):
        import restaurant.branch.signals
