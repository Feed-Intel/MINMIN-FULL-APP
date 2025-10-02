# from django_filters import rest_framework as filters
# from .models import Menu

# class MenuFilter(filters.FilterSet):
#     branch = filters.UUIDFilter(field_name='branch')  # Exact match for tenant
#     name = filters.CharFilter(lookup_expr='icontains')  # Case-insensitive substring match
#     tags = filters.CharFilter(lookup_expr='icontains')  # Case-insensitive substring match
#     category = filters.CharFilter(lookup_expr='icontains')  # Case-insensitive substring match
#     min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')  # Min price
#     max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')  # Max price
#     is_side = filters.BooleanFilter()  # Exact match for boolean field
#     start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
#     end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')  # Created before

#     class Meta:
#         model = Menu
#         fields = [
#             'branch', 'name', 'tags', 'category', 'min_price', 'max_price', 
#             'is_side', 'start_date', 'end_date'
#         ]
from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Menu

class MenuFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    tags = filters.CharFilter(method='filter_tags')  # Custom method for tags
    categories = filters.CharFilter(method='filter_categories')  # Custom method for categories
    category = filters.CharFilter(method='filter_categories')  # Backwards-compatible alias
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
    is_side = filters.BooleanFilter()
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Menu
        fields = ['search', 'tags', 'categories', 'category', 'min_price', 'max_price', 'is_side', 'start_date', 'end_date']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) | Q(tenant__restaurant_name__icontains=value)
        )

    def filter_tags(self, queryset, name, value):
        # Split comma-separated tags and create OR conditions
        tags = [tag.strip() for tag in value.split(',')]
        q_objects = Q()
        for tag in tags:
            q_objects |= Q(tags__icontains=tag)
        return queryset.filter(q_objects)

    def filter_categories(self, queryset, name, value):
        # Split comma-separated categories and create OR conditions
        categories = [cat.strip() for cat in value.split(',') if cat.strip()]
        q_objects = Q()
        for cat in categories:
            q_objects |= Q(categories__icontains=cat)
        return queryset.filter(q_objects)
