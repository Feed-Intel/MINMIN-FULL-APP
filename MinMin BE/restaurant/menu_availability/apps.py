from django.apps import AppConfig


class MenuAvailabilityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'restaurant.menu_availability'

    def ready(self):   
        import restaurant.menu_availability.signals
