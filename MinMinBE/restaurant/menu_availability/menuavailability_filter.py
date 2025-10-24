from django_filters import rest_framework as filters
from django.db.models.functions import Cast
from django.db.models import TextField, Q
from .models import MenuAvailability

class MenuAvailabilityFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    branch = filters.UUIDFilter(field_name='branch')
    tenant = filters.UUIDFilter(field_name='branch__tenant')
    menu_item = filters.CharFilter(field_name='menu_item__name', lookup_expr='icontains')
    is_available = filters.BooleanFilter()
    special_notes = filters.CharFilter(lookup_expr='icontains')
    start_date = filters.DateTimeFilter(field_name='updated_at', lookup_expr='gte')
    end_date = filters.DateTimeFilter(field_name='updated_at', lookup_expr='lte')
    # New price filters
    min_price = filters.NumberFilter(field_name='menu_item__price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='menu_item__price', lookup_expr='lte')
    # New category and tag filters
    categories = filters.CharFilter(method='filter_categories')
    category = filters.CharFilter(method='filter_categories')
    tags = filters.CharFilter(method='filter_tags')

    class Meta:
        model = MenuAvailability
        fields = [
            'search', 'branch', 'menu_item', 'is_available', 'special_notes',
            'start_date', 'end_date', 'min_price', 'max_price', 'categories', 'category', 'tags'
        ]

    def filter_search(self, queryset, name, value):
        queryset = queryset.annotate(
            categories_text=Cast('menu_item__categories', TextField()),
            tags_text=Cast('menu_item__tags', TextField())
        )
        search_query = (
            Q(menu_item__name__icontains=value)
            | Q(branch__tenant__restaurant_name__icontains=value)
            | Q(categories_text__icontains=value)
            | Q(tags_text__icontains=value)
        )
        if self.request.user.user_type in ['admin', 'restaurant']:
            return queryset.filter(search_query).distinct()
        return queryset.filter(search_query & Q(is_available=True)).distinct()


    def filter_categories(self, queryset, name, value):
        queryset = queryset.annotate(categories_text=Cast('menu_item__categories', TextField()))
        categories = [cat.strip() for cat in value.split(',') if cat.strip()]
        q_objects = Q()
        for cat in categories:
            q_objects |= Q(categories_text__icontains=cat)
        return queryset.filter(q_objects).distinct()


    def filter_tags(self, queryset, name, value):
        queryset = queryset.annotate(tags_text=Cast('menu_item__tags', TextField()))
        tags = [tag.strip() for tag in value.split(',') if tag.strip()]
        q_objects = Q()
        for tag in tags:
            q_objects |= Q(tags_text__icontains=tag)
        return queryset.filter(q_objects).distinct()
