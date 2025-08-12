from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import HasCustomAPIKey
from django.db.models import Q
from .models import RelatedMenuItem
from .serializers import RelatedMenuItemSerializer
from .relatedMenuItemFilter import RelatedMenuItemFilter
from core.cache import CachedModelViewSet

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
        user_branch_tenant = None
        if user.branch:
            user_branch_tenant = user.branch.tenant
        if user.user_type == 'customer':
            queryset = RelatedMenuItem.objects.select_related('related_item','menu_item').all()
        else:
            queryset = RelatedMenuItem.objects.filter(Q(tenant__admin=user.id) | Q(tenant=user_branch_tenant)).select_related('related_item', 'menu_item')
        return queryset

