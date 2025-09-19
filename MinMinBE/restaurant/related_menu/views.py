from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import HasCustomAPIKey
from django.db.models import Q
from .models import RelatedMenuItem
from .serializers import RelatedMenuItemSerializer
from .relatedMenuItemFilter import RelatedMenuItemFilter
from core.cache import CachedModelViewSet
from accounts.utils import get_user_branch, get_user_tenant

class RelatedMenuItemPagination(PageNumberPagination):
    page_size = 10

class RelatedMenuItemView(CachedModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = RelatedMenuItem.objects.all()
    serializer_class = RelatedMenuItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = RelatedMenuItemFilter
    pagination_class = RelatedMenuItemPagination

    def get_queryset(self):
        # Get the currently authenticated user
        user = self.request.user
        if user.user_type == 'customer':
            return RelatedMenuItem.objects.select_related('related_item', 'menu_item')

        if user.user_type == 'admin':
            return RelatedMenuItem.objects.select_related('related_item', 'menu_item')

        tenant = get_user_tenant(user)
        if tenant is None:
            return RelatedMenuItem.objects.none()

        queryset = RelatedMenuItem.objects.filter(tenant=tenant).select_related('related_item', 'menu_item')

        if user.user_type == 'branch' and get_user_branch(user) is None:
            return RelatedMenuItem.objects.none()

        return queryset
