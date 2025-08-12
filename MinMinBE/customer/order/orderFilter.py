from django_filters import rest_framework as filters
from .models import Order, OrderItem

class OrderFilter(filters.FilterSet):
    tenant = filters.UUIDFilter(field_name='tenant')  # Exact match for tenant
    branch = filters.UUIDFilter(field_name='branch')  # Exact match for branch
    # print(field_name='branch')
    print(tenant)
    table = filters.UUIDFilter(field_name='table')    # Exact match for table
    customer = filters.UUIDFilter(field_name='customer')  # Exact match for customer
    status = filters.ChoiceFilter(choices=Order.STATUS_TYPE_CHOICES)  # Filter by status
    min_total_price = filters.NumberFilter(field_name='total_price', lookup_expr='gte')  # Min price
    max_total_price = filters.NumberFilter(field_name='total_price', lookup_expr='lte')  # Max price
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')  # Created after
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')    # Created before

    class Meta:
        model = Order
        fields = [
            'tenant_id', 'branch', 'table_id', 'customer_id', 'status', 
            'min_total_price', 'max_total_price', 'start_date', 'end_date'
        ]


class OrderItemFilter(filters.FilterSet):
    order_id = filters.UUIDFilter(field_name='order_id')
    menu_item_id = filters.UUIDFilter(field_name='menu_item_id')

    class Meta:
        model = OrderItem
        fields = ['order_id', 'menu_item_id']