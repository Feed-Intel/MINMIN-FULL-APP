import django_filters
from .models import Payment

class PaymentFilter(django_filters.FilterSet):
    payment_status = django_filters.CharFilter(field_name='payment_status')
    payment_method = django_filters.CharFilter(field_name='payment_method')
    order_id = django_filters.UUIDFilter(field_name='order_id')

    class Meta:
        model = Payment
        fields = ['payment_status', 'payment_method', 'order_id']
