from django_filters import rest_framework as filters

from .models import Order, OrderItem


class OrderFilter(filters.FilterSet):
    tenant = filters.UUIDFilter(field_name="tenant_id")
    branch = filters.UUIDFilter(field_name="branch_id")
    table = filters.UUIDFilter(field_name="table_id")
    customer = filters.UUIDFilter(field_name="customer_id")
    status = filters.ChoiceFilter(field_name="status", choices=Order.STATUS_TYPE_CHOICES)
    min_total_price = filters.NumberFilter(field_name="total_price", lookup_expr="gte")
    max_total_price = filters.NumberFilter(field_name="total_price", lookup_expr="lte")
    start_date = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    end_date = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Order
        fields = [
            "tenant",
            "branch",
            "table",
            "customer",
            "status",
            "min_total_price",
            "max_total_price",
            "start_date",
            "end_date",
        ]


class OrderItemFilter(filters.FilterSet):
    order_id = filters.UUIDFilter(field_name='order_id')
    menu_item_id = filters.UUIDFilter(field_name='menu_item_id')

    class Meta:
        model = OrderItem
        fields = ['order_id', 'menu_item_id']
