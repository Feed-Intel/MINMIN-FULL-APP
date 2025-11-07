from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Table

class TableFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    table_code = filters.CharFilter(field_name='table_code', lookup_expr='icontains')
    branch = filters.UUIDFilter(field_name='branch')  # Exact match for branch
    is_fast_table = filters.BooleanFilter()  # Exact match for fast table
    is_delivery_table = filters.BooleanFilter()  # Exact match for delivery table
    is_inside_table = filters.BooleanFilter()  # Exact match for inside table
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')  # Created before

    class Meta:
        model = Table
        fields = [
            'search','branch', 'is_fast_table', 'is_delivery_table', 
            'is_inside_table', 'start_date', 'end_date'
        ]
    
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            (Q(table_code__icontains=value) | Q(branch__address__icontains=value))
        )
