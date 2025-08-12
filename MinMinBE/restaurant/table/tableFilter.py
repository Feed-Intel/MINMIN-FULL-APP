from django_filters import rest_framework as filters
from .models import Table

class TableFilter(filters.FilterSet):
    branch_id = filters.UUIDFilter(field_name='branch')  # Exact match for branch
    is_fast_table = filters.BooleanFilter()  # Exact match for fast table
    is_delivery_table = filters.BooleanFilter()  # Exact match for delivery table
    is_inside_table = filters.BooleanFilter()  # Exact match for inside table
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')  # Created before

    class Meta:
        model = Table
        fields = [
            'branch', 'is_fast_table', 'is_delivery_table', 
            'is_inside_table', 'start_date', 'end_date'
        ]
