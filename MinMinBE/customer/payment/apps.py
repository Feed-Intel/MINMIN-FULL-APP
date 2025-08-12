from django.apps import AppConfig


class PaymentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'customer.payment'

    def ready(self):
        import customer.payment.signals
