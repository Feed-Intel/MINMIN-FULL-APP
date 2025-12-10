from rest_framework.pagination import PageNumberPagination
from rest_framework import viewsets,filters
from rest_framework.decorators import action
from django.db.models import Q, F, Sum, DecimalField, ExpressionWrapper
from django.db.models.functions import Coalesce
from accounts.permissions import HasCustomAPIKey
from accounts.utils import get_user_branch, get_user_tenant
from django.core.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from .models import Order
from .serializers import OrderSerializer
from .orderFilter import OrderFilter
from restaurant.table.models import Table
from restaurant.table.serializers import TableSerializer
from restaurant.branch.models import Branch
from restaurant.menu.models import Menu
from core.redis_client import redis_client
from .utils import calculate_discount_from_data, calculate_redeem_amount


class OrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class OrderView(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey]
    filter_backends = [DjangoFilterBackend]
    filterset_class = OrderFilter
    serializer_class = OrderSerializer
    pagination_class = OrderPagination

    def get_queryset(self):
        user = self.request.user
        user_location = redis_client.get(str(user.id))
        if user.user_type == 'customer':
            qs = Order.objects.filter(customer=user,status__in=['placed', 'progress', 'payment_complete', 'delivered', 'cancelled']).select_related(
                    'table', 'customer', 'branch', 'tenant'
            ).prefetch_related('items').order_by('-updated_at')
            if user_location:
                latitude_str, longitude_str = user_location.split(',')
                if latitude_str not in ('null', 'None') and longitude_str not in ('null', 'None'):
                    latitude = float(latitude_str)
                    longitude = float(longitude_str)
                    user_location = Point(longitude, latitude, srid=4326)
                    qs =  qs.annotate(distance=Distance('branch__location', user_location))
            return qs
        
        total_price_expression = Coalesce(
            Sum(
                ExpressionWrapper(
                    F('items__price') * F('items__quantity'),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                )
            ),
            0,
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

        queryset = (
            Order.objects.filter(
                status__in=['placed', 'progress', 'payment_complete', 'delivered', 'cancelled']
            )
            .select_related('table', 'customer', 'branch', 'tenant')
            .prefetch_related('items')
            .annotate(total_price=total_price_expression)
            .order_by('-updated_at')
        )

        if user.user_type == 'admin':
            return queryset

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return queryset.filter(branch__tenant=tenant) if tenant else queryset.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            return queryset.filter(branch=branch) if branch else queryset.none()

        return queryset.none()




  
    def perform_create(self, serializer):
        """Automatically assign delivery table if none provided."""
        with transaction.atomic():
            
            order = serializer.save(customer=self.request.user)
            
            # Only process if no table was provided
            if not order.table:
                branch = order.branch  # Assuming branch is required in serializer
                
                # Find first delivery table for this branch
                delivery_table = Table.objects.filter(
                    branch=branch,
                    is_delivery_table=True
                ).first()

                if not delivery_table:
                    delivery_table_serializer = TableSerializer(data={'branch': branch.id, 'is_delivery_table': True})
                    delivery_table_serializer.is_valid()
                    delivery_table = delivery_table_serializer.save()
                order.table = delivery_table
                order.save(update_fields=['table'])

        
    def update(self, request, *args, **kwargs):
        # Get the instance to be updated
        instance = self.get_object()

        # Authorization check
        if (
            request.user.user_type not in ['admin', 'restaurant']
            and (request.data.get('status') == 'delivered' or instance.customer != request.user)
        ):
            return Response({'detail': 'You are not allowed to perform this action.'}, status=status.HTTP_403_FORBIDDEN)

        # Get serializer with the current instance
        partial = kwargs.get('partial', False)  # For PATCH requests
        serializer = self.get_serializer(instance=instance, data=request.data, partial=partial)

        # Validate the data
        serializer.is_valid(raise_exception=True)

        # Save the changes
        self.perform_update(serializer)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response({"message": "Order deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        order = self.get_object()
        user = request.user

        if user.user_type == 'customer' and order.customer != user:
            raise PermissionDenied("You are not allowed to perform this action.")

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            if not branch or order.branch_id != branch.id:
                raise PermissionDenied("You are not allowed to perform this action.")

        # Admins and restaurant owners are already constrained by queryset
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'], url_path='check-discount')
    def check_discount(self, request):
        branch_id = request.data.get('branch')
        items_data = request.data.get('items', [])
        tenant = request.data.get('tenant')
        coupon = request.data.get('coupon', None)

        # Validate branch
        try:
            Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate items and fetch current prices
        valid_items = []
        for item in items_data:
            menu_item = item.get('menu_item')
            quantity = item.get('quantity')
            if not (menu_item and quantity):
                return Response({'error': 'Each item must have menu_item and quantity'}, status=status.HTTP_400_BAD_REQUEST)
            try:

                menu_item = Menu.objects.get(id=menu_item)
            except Menu.DoesNotExist:
                return Response({'error': f'Menu item {menu_item} not found'}, status=status.HTTP_400_BAD_REQUEST)
            valid_items.append({
                'menu_item': str(menu_item.id),
                'quantity': quantity,
                'price': float(menu_item.price)
            })

        # Calculate order total
        order_total = sum(item['price'] * item['quantity'] for item in valid_items)

        # Calculate discount
        discount_amount,typeDiscount,freeItems = calculate_discount_from_data(
            tenant=tenant,
            branch = branch_id,
            items_data=valid_items,
            coupon=coupon,
            order_total=order_total
        )
        redeem_amount = calculate_redeem_amount(customer_id=request.user.id, tenant_id=tenant)

        return Response({'discount_amount': discount_amount,"redeem_amount":redeem_amount,"typeDiscount":typeDiscount,"freeItems":freeItems}, status=status.HTTP_200_OK)
