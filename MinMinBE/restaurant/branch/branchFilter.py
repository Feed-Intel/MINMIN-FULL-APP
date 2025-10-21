from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Branch

class BranchFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    tenant = filters.UUIDFilter(field_name='tenant')  # Exact match for tenant
    address = filters.CharFilter(lookup_expr='icontains')  # Case-insensitive substring match
    is_default = filters.BooleanFilter()  # Exact match for boolean field
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')    # Created before

    class Meta:
        model = Branch
        fields = [
            'tenant_id', 'address', 'is_default', 'start_date', 'end_date'
        ]
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            (Q(address__icontains=value) | Q(tenant__restaurant_name__icontains=value))
        )
