from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Order # Assuming this is your Order model


class OrderFilter(filters.FilterSet):
    # 1. General Search (Order ID, Customer Name, Branch Address)
    search = filters.CharFilter(method='filter_search')
    
    # 2. Status: Use MultipleChoiceFilter to handle comma-separated statuses (e.g., 'placed,progress')
    # The `lookup_expr` is not needed here as it defaults to `in` for multiple choices.
    status = filters.MultipleChoiceFilter(field_name="status", choices=Order.STATUS_TYPE_CHOICES)
    
    # 3. Channel: We'll assume the frontend sends 'channel' which maps to 'table' logic.
    # We will implement the channel logic in a custom method below.
    channel = filters.CharFilter(method='filter_channel')

    # 4. Date Range: Rename start_date/end_date to match frontend props: 'from' and 'to'
    from_date = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    to_date = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    # 5. Branch: The field name should be `branchId` to match the frontend prop name `branchId`
    # However, Django's default field_name resolution is fine if you use `branch` in the URL.
    # Let's stick with the most direct field relation:
    branch = filters.UUIDFilter(field_name="branch_id")
    
    # (Removed other filters like tenant, customer, table, price limits for brevity,
    # but you can keep them if needed)

    class Meta:
        model = Order
        fields = [
            "search", "status", "branch", "from_date", "to_date", "channel"
        ]

    # Custom search logic (this looks correct for the fields you listed)
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(order_id__icontains=value) |
            Q(customer__full_name__icontains=value) |
            Q(branch__address__icontains=value) 
        )

    # Custom Channel filter to match your frontend logic (DINE_IN, TAKEAWAY, DELIVERY)
    def filter_channel(self, queryset, name, value):
        if value == 'DINE_IN':
            # Not a fast table or a delivery table
            return queryset.filter(table__is_fast_table=False, table__is_delivery_table=False)
        elif value == 'TAKEAWAY':
            # Matches the frontend's 'TAKEAWAY' logic (fast table)
            return queryset.filter(table__is_fast_table=True)
        elif value == 'DELIVERY':
            # Matches the frontend's 'DELIVERY' logic (delivery table)
            return queryset.filter(table__is_delivery_table=True)
        return queryset