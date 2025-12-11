from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Post

class FeedFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = Post
        fields = ['search']
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(caption__icontains=value) | Q(user__full_name__icontains=value) | Q(location__icontains=value) | Q(tags__name__icontains=value)).distinct()