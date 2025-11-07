from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Combo, ComboItem

class ComboFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    tenant = filters.UUIDFilter(field_name='tenant')  # Exact match for tenant
    branch = filters.UUIDFilter(field_name='branch')  # Exact match for branch
    name = filters.CharFilter(lookup_expr='icontains')  # Case-insensitive substring match
    is_custom = filters.BooleanFilter()  # Exact match for boolean field
    min_price = filters.NumberFilter(field_name='combo_price', lookup_expr='gte')  # Min price
    max_price = filters.NumberFilter(field_name='combo_price', lookup_expr='lte')  # Max price
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')  # Created before

    class Meta:
        model = Combo
        fields = [
            'tenant', 'branch', 'name', 'is_custom', 'min_price', 'max_price', 
            'start_date', 'end_date'
        ]
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) | Q(tenant__restaurant_name__icontains=value) | Q(branch__address__icontains=value)
        )


class ComboItemFilter(filters.FilterSet):
    combo = filters.UUIDFilter(field_name='combo')  # Exact match for combo
    menu_item = filters.UUIDFilter(field_name='menu_item')  # Exact match for menu item
    min_quantity = filters.NumberFilter(field_name='quantity', lookup_expr='gte')  # Min quantity
    max_quantity = filters.NumberFilter(field_name='quantity', lookup_expr='lte')  # Max quantity
    is_half = filters.BooleanFilter()  # Exact match for boolean field

    class Meta:
        model = ComboItem
        fields = [
            'combo', 'menu_item', 'min_quantity', 'max_quantity', 'is_half'
        ]
