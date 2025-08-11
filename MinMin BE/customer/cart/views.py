from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from accounts.permissions import IsAdminOrCustomer,HasCustomAPIKey
from .cartFilters import CartFilter, CartItemFilter
from django.core.cache import cache
from rest_framework.pagination import PageNumberPagination

class CartPagination(PageNumberPagination):
    page_size = 10

class CartView(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,IsAdminOrCustomer,HasCustomAPIKey]
    queryset = Cart.objects.prefetch_related('cart_items').all()
    serializer_class = CartSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = CartFilter
    pagination_class= CartPagination

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            carts = Cart.objects.select_related('tenant', 'customer').prefetch_related('cart_items').all()
        else:
            carts = Cart.objects.filter(customer=user).select_related('tenant', 'customer').prefetch_related('cart_items')
        return carts

class CartItemView(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,IsAdminOrCustomer,HasCustomAPIKey]
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = CartItemFilter
    pagination_class = CartPagination

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            cart_items = CartItem.objects.select_related('menu_item', 'cart').all()
        else:
            cart_items = CartItem.objects.filter(cart__customer=user).select_related('menu_item', 'cart')
        return cart_items
