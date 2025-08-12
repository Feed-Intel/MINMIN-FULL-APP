from django.apps import AppConfig


class RelatedMenuConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'restaurant.related_menu'

    def ready(self):
        import restaurant.related_menu.signals
