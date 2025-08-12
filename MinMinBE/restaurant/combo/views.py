from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache 
from rest_framework.pagination import PageNumberPagination
from .models import Combo, ComboItem
from .serializers import ComboSerializer, ComboItemSerializer
from accounts.permissions import HasCustomAPIKey
from rest_framework.permissions import IsAuthenticated
from .comboFilter import ComboFilter,ComboItemFilter

class ComboPagination(PageNumberPagination):
    page_size = 10


class ComboView(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = Combo.objects.all()
    serializer_class = ComboSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ComboFilter
    pagination_class = ComboPagination

    def get_queryset(self):
        # Get the currently authenticated user
        user = self.request.user
        if user.user_type == 'admin' or user.user_type == 'restaurant':
            queryset = Combo.objects.filter(tenant__admin=user.id).select_related('branch').prefetch_related('combo_items')
        else:
            queryset = Combo.objects.filter(branch=user.branch).select_related('branch').prefetch_related('combo_items')
        return queryset

class ComboItemPagination(PageNumberPagination):
    page_size = 10


class ComboItemView(viewsets.ModelViewSet):
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
            queryset = ComboItem.objects.select_related('combo','menu_item').all()
        else:
            queryset = ComboItem.objects.filter(combo__tenant__admin=user.id).select_related('combo','menu_item')
        return queryset
    