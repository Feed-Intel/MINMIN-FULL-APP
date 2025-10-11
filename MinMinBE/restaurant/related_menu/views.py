from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import HasCustomAPIKey
from .models import RelatedMenuItem
from .serializers import (
    RelatedMenuItemSerializer,
    RelatedMenuBulkCreateSerializer,
)
from .relatedMenuItemFilter import RelatedMenuItemFilter
from core.cache import CachedModelViewSet
from accounts.utils import get_user_branch, get_user_tenant
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class RelatedMenuItemPagination(PageNumberPagination):
    page_size = 10


class RelatedMenuItemView(CachedModelViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey]
    queryset = RelatedMenuItem.objects.all()
    serializer_class = RelatedMenuItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = RelatedMenuItemFilter
    pagination_class = RelatedMenuItemPagination

    def get_queryset(self):
        user = self.request.user
        if user.user_type in ['customer', 'admin']:
            return RelatedMenuItem.objects.select_related('related_item', 'menu_item')

        tenant = get_user_tenant(user)
        if not tenant:
            return RelatedMenuItem.objects.none()

        queryset = RelatedMenuItem.objects.filter(tenant=tenant).select_related('related_item', 'menu_item')

        if user.user_type == 'branch' and get_user_branch(user) is None:
            return RelatedMenuItem.objects.none()

        return queryset
    
    def get_paginated_response(self, data):
        # If 'nopage' query param is set, return unpaginated data
        if self.request.query_params.get('nopage') == '1':
            return Response(data)
        return super().get_paginated_response(data)

    def paginate_queryset(self, queryset):
        # If 'nopage' query param is set, skip pagination
        if self.request.query_params.get('nopage') == '1':
            return None
        return super().paginate_queryset(queryset)

    def get_serializer_class(self):
        if self.action == 'bulk_create':
            return RelatedMenuBulkCreateSerializer
        return RelatedMenuItemSerializer

    @action(methods=['post'], detail=False, url_path='bulk-create')
    def bulk_create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created_items = serializer.save()
        read_serializer = RelatedMenuItemSerializer(created_items, many=True, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)