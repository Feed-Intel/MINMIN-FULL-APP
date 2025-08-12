from django_filters import rest_framework as filters
from .models import Tenant

class TenantFilter(filters.FilterSet):
    restaurant_name = filters.CharFilter(lookup_expr='icontains')  # Case-insensitive substring search for restaurant name
    admin = filters.UUIDFilter(field_name='admin')  # Exact match for admin user
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')  # Created before

    class Meta:
        model = Tenant
        fields = [
            'restaurant_name', 'admin', 'start_date', 'end_date'
        ]
