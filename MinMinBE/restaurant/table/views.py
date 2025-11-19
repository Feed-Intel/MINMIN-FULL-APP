from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.permissions import HasCustomAPIKey, IsAdminRestaurantOrBranch
from accounts.utils import get_user_branch, get_user_tenant
from .models import Table
from .serializers import TableSerializer
from .tableFilter import TableFilter
from core.cache import CachedModelViewSet


class TableViewPagination(PageNumberPagination):
    page_size = 10


class TableView(CachedModelViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey, IsAdminRestaurantOrBranch]
    serializer_class = TableSerializer
    pagination_class = TableViewPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = TableFilter
    queryset = Table.objects.select_related('branch').all()

    def get_queryset(self):
        """Retrieve tables filtered by user type with optimized queries."""
        user = self.request.user

        fields_to_fetch = ['id', 'branch', 'is_fast_table', 'is_delivery_table', 'is_inside_table','qr_code']

        base_qs = Table.objects.select_related('branch', 'qr_code').only(*fields_to_fetch)

        if user.user_type == 'admin':
            return base_qs

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return base_qs.filter(branch__tenant=tenant) if tenant else base_qs.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            return base_qs.filter(branch=branch) if branch else base_qs.none()

        return base_qs.none()
    
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

    def destroy(self, request, *args, **kwargs):
        """Handles deletion of a table with validation error handling."""
        instance = get_object_or_404(Table, pk=kwargs.get("pk"))
        try:
            instance.delete()
            return Response({"message": "Table deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
