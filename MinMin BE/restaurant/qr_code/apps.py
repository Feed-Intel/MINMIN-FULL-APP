from django.apps import AppConfig


class QrCodeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'restaurant.qr_code'

    def ready(self):
        import restaurant.qr_code.signals
