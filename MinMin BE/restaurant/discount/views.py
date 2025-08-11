from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from .models import Discount, DiscountRule, DiscountApplication, Coupon
from .serializers import DiscountSerializer, DiscountRuleSerializer, DiscountApplicationSerializer, CouponSerializer
from customer.order.models import Order
from .utils import apply_discounts
from accounts.permissions import HasCustomAPIKey,IsAdminOrRestaurant
from .services import get_big_discount_items
from restaurant.menu_availability.serializers import MenuAvailabilitySerializer
from restaurant.tenant.models import Tenant

class DiscountPagination(PageNumberPagination):
    page_size = 10

class DiscountViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'off_peak_hours', 'is_stackable']
    ordering_fields = [ 'priority']
    pagination_class = DiscountPagination
    # ordering = ['-valid_from']

    def get_queryset(self):
        user = self.request.user
        if user.user_type =='restaurant' or user.user_type == 'admin':
            queryset = Discount.objects.filter(tenant__admin=user.id).select_related('tenant', 'branch')
        elif user.user_type == 'branch':
            queryset = Discount.objects.filter(branch=user.branch).select_related('tenant', 'branch')
        else:
            queryset = Discount.objects.none()  # Unhandled user type

        return queryset
    @action(detail=False, methods=['post'],url_path='apply-discount')
    def apply_discounts_to_order(self, request):
        """
        Apply discounts to a specific order and return the applied discounts and total discount.
        """
        order_id = request.data.get('order')
        coupon = request.data.get('coupon')
        if not order_id:
            return Response({"detail": "Order ID is required"}, status=400)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)

        discounts = Discount.objects.filter(tenant=order.tenant, branch=order.branch)
        applied_discounts, total_discount = apply_discounts(order, discounts,coupon)

        for discount_info in applied_discounts:
            DiscountApplication.objects.create(
                order=order,
                discount=discount_info['discount_id'],
                applied_amount=discount_info['applied_amount']
            )

        return Response({
            "applied_discounts": applied_discounts,
            "total_discount": total_discount
        })
    @action(detail=True, methods=['get'])
    def discount_rules(self, request, pk=None):
        """
        Retrieve all discount rules related to a specific discount.
        """
        if request.user.user_type == 'customer':
            return Response({'detail': 'You are not allowed to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
        discount = self.get_object()
        rules = discount.discount_discount_rules.all()
        serializer = DiscountRuleSerializer(rules, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def big_discount_items(self, request):
        """
        API endpoint for retrieving menu items with the biggest discounts.
        """
        discount_items = get_big_discount_items()
        serializer = MenuAvailabilitySerializer(discount_items, many=True,context={'request': request})
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response({"message": "Discount rule deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DiscountRulePagination(PageNumberPagination):
    page_size = 10

class DiscountRuleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey,IsAdminOrRestaurant]
    queryset = DiscountRule.objects.all()
    serializer_class = DiscountRuleSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['discount_id', 'min_items', 'combo_size', 'min_price']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    pagination_class = DiscountRulePagination

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            queryset = DiscountRule.objects.select_related('discount_id').all()
        elif user.user_type == 'restaurant':
            queryset = DiscountRule.objects.filter(tenant__admin=user.id).select_related('discount_id')
        else:
            queryset = DiscountRule.objects.none()  # Unhandled user type
        return queryset
    @action(detail=True, methods=['get'])
    def discount_applications(self, request, pk=None):
        """
        Retrieve all discount applications related to a specific discount rule.
        """
        rule = self.get_object()
        applications = rule.discount_discount_applications.all()
        serializer = DiscountApplicationSerializer(applications, many=True)
        return Response(serializer.data)

class DiscountApplicationPagination(PageNumberPagination):
    page_size = 10
class DiscountApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey,IsAdminOrRestaurant]
    queryset = DiscountApplication.objects.all()
    serializer_class = DiscountApplicationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['order', 'discount', 'created_at']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    pagination_class = DiscountApplicationPagination

    def get_queryset(self):
        # Get the currently authenticated user
        user = self.request.user
        if user.user_type == 'admin':
            queryset = DiscountApplication.objects.all()
        else:
            queryset = DiscountApplication.objects.filter(order__tenant__admin=user.id)
        return queryset


class CouponPagination(PageNumberPagination):
    page_size = 10
class CouponViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey,IsAdminOrRestaurant]
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['discount_code']
    ordering_fields = ['created_at', 'updated_at','valid_from', 'valid_until']
    ordering = ['-created_at']
    pagination_class = CouponPagination

    def perform_create(self, serializer):
        tenant =  Tenant.objects.get(admin=self.request.user)
        if tenant:
           return serializer.save(tenant=tenant)
        tenant = self.request.user.branch.tenant
        return serializer.save(tenant=tenant)
    
    def perform_update(self, serializer):
        tenant =  Tenant.objects.get(admin=self.request.user)
        if tenant:
           return serializer.save(tenant=tenant)
        tenant = self.request.user.branch.tenant
        return serializer.save(tenant=tenant)
        

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            queryset = Coupon.objects.all()
        elif user.user_type == 'restaurant':
            queryset = Coupon.objects.filter(tenant__admin=user.id).distinct()
        elif user.user_type == 'branch':
            queryset = Coupon.objects.filter(branch=user.branch).distinct()
        else:
            queryset = Coupon.objects.none()  # Unhandled user type
        return queryset
    


    

