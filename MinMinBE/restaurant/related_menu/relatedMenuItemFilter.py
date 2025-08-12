from django_filters import rest_framework as filters
from .models import RelatedMenuItem

class RelatedMenuItemFilter(filters.FilterSet):
    tenant = filters.UUIDFilter(field_name='tenant')  # Exact match for tenant
    menu_item = filters.UUIDFilter(field_name='menu_item')  # Exact match for menu item
    related_item = filters.UUIDFilter(field_name='related_item')  # Exact match for related item
    tag = filters.CharFilter(lookup_expr='icontains')  # Case-insensitive substring search for tag
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')  # Created before

    class Meta:
        model = RelatedMenuItem
        fields = [
            'tenant', 'menu_item', 'related_item', 'tag', 'start_date', 'end_date'
        ]
