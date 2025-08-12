from django_filters import rest_framework as filters
from .models import Address

class AddressFilter(filters.FilterSet):
    created_at = filters.DateFromToRangeFilter()
    updated_at = filters.DateFromToRangeFilter()
    address_line = filters.CharFilter(lookup_expr='icontains')
    label = filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Address
        fields = [
            'user',           # Ensure this matches the field in your model
            'label',
            'address_line',
            'is_default',
            'created_at',
            'updated_at',
        ]
