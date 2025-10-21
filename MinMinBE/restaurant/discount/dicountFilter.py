from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Discount, Coupon

class DiscountFilter(filters.FilterSet):
    # Standard Filters based on Model Fields
    search = filters.CharFilter(method='filter_search')
    tenant = filters.UUIDFilter(field_name='tenant__id')
    
    # Custom method filter for Many-to-Many 'branches' field
    branches = filters.CharFilter(method='filter_branches')
    
    # Filters on the related Coupon's discount_code
    discount_code = filters.CharFilter(field_name='coupon__discount_code', lookup_expr='icontains')
    
    # Boolean fields from the model
    # is_valid is used for the common 'is_active' filter pattern
    is_active = filters.BooleanFilter(field_name='is_valid') 
    
    # Date/Time filters corrected to use the model's 'valid_from' and 'valid_until' fields
    start_date = filters.DateTimeFilter(field_name='valid_from', lookup_expr='gte')
    end_date = filters.DateTimeFilter(field_name='valid_until', lookup_expr='lte')

    # Custom method filters for many-to-many/related fields
    categories = filters.CharFilter(method='filter_categories')
    category = filters.CharFilter(method='filter_categories')
    tags = filters.CharFilter(method='filter_tags')


    class Meta:
        model = Discount
        fields = [
            'search', 'tenant', 'branches', 'discount_code', 
            'is_active', 'start_date', 'end_date',
            'categories', 'category', 'tags',
            'type', 'off_peak_hours', 'priority', 'is_stackable' # Direct model fields included
        ]

    def filter_branches(self, queryset, name, value):
        branch_ids = value.split(',')
        return queryset.filter(branches__id__in=branch_ids).distinct()

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) | 
            Q(tenant__restaurant_name__icontains=value) |
            Q(branches__address__icontains=value)
        )
    def filter_categories(self, queryset, name, value):
        # Implementation depends on how 'categories' are linked to Discount
        return queryset # Placeholder
    
    def filter_tags(self, queryset, name, value):
        # Implementation depends on how 'tags' are linked to Discount
        return queryset # Placeholder


class CouponFilter(filters.FilterSet):
    # Standard Filters based on Model Fields
    search = filters.CharFilter(method='filter_search')
    tenant = filters.UUIDFilter(field_name='tenant__id')
    
    # Custom method filter for Many-to-Many 'branches' field
    branches = filters.CharFilter(method='filter_branches')
    
    discount_code = filters.CharFilter(field_name='discount_code', lookup_expr='icontains')
    
    # Boolean field from the model
    is_active = filters.BooleanFilter(field_name='is_valid')
    
    # Date/Time filters corrected to use the model's 'valid_from' and 'valid_until' fields
    start_date = filters.DateTimeFilter(field_name='valid_from', lookup_expr='gte')
    end_date = filters.DateTimeFilter(field_name='valid_until', lookup_expr='lte')

    class Meta:
        model = Coupon
        fields = [
            'search', 'tenant', 'branches', 'discount_code', 
            'is_active', 'start_date', 'end_date'
        ]

    def filter_branches(self, queryset, name, value):
        branch_ids = value.split(',')
        return queryset.filter(branches__id__in=branch_ids).distinct()
        
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(discount_code__icontains=value) | 
            Q(tenant__restaurant_name__icontains=value) |
            Q(branches__address__icontains=value)
        )