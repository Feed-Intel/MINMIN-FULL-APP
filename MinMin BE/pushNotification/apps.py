from django.apps import AppConfig


class PushnotificationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pushNotification'

    def ready(self):
        import pushNotification.signals
