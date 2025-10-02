from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from .models import Combo, ComboItem
from .serializers import ComboSerializer, ComboItemSerializer
from accounts.permissions import HasCustomAPIKey
from rest_framework.permissions import IsAuthenticated
from .comboFilter import ComboFilter,ComboItemFilter
from core.cache import CachedModelViewSet
from accounts.utils import get_user_branch, get_user_tenant

class ComboPagination(PageNumberPagination):
    page_size = 10


class ComboView(CachedModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = Combo.objects.all()
    serializer_class = ComboSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ComboFilter
    pagination_class = ComboPagination

    def get_queryset(self):
        # Get the currently authenticated user
        user = self.request.user
        if user.user_type == 'admin':
            return Combo.objects.select_related('branch').prefetch_related('combo_items')

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return Combo.objects.filter(tenant=tenant).select_related('branch').prefetch_related('combo_items') if tenant else Combo.objects.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            return Combo.objects.filter(branch=branch).select_related('branch').prefetch_related('combo_items') if branch else Combo.objects.none()

        return Combo.objects.none()

class ComboItemPagination(PageNumberPagination):
    page_size = 10


class ComboItemView(CachedModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = ComboItem.objects.all()
    serializer_class = ComboItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ComboItemFilter
    pagination_class = ComboItemPagination

    def get_queryset(self):
        # Get the currently authenticated user
        user = self.request.user
        if user.user_type == 'admin':
            return ComboItem.objects.select_related('combo', 'menu_item')

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return ComboItem.objects.filter(combo__tenant=tenant).select_related('combo', 'menu_item') if tenant else ComboItem.objects.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            return ComboItem.objects.filter(combo__branch=branch).select_related('combo', 'menu_item') if branch else ComboItem.objects.none()

        return ComboItem.objects.none()
    
