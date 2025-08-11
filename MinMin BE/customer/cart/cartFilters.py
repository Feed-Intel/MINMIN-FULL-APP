from django_filters import rest_framework as filters
from .models import Cart, CartItem

class CartFilter(filters.FilterSet):
    customer_id = filters.UUIDFilter(field_name='customer')  # Filter by customer
    tenant_id = filters.UUIDFilter(field_name='tenant')  # Filter by tenant
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created on or after
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')  # Created on or before

    class Meta:
        model = Cart
        fields = ['customer', 'tenant', 'created_after', 'created_before']

class CartItemFilter(filters.FilterSet):
    cart_id = filters.UUIDFilter(field_name='cart')  # Filter by cart
    menu_item_id = filters.UUIDFilter(field_name='menu_item')  # Filter by menu item

    class Meta:
        model = CartItem
        fields = ['cart', 'menu_item']
