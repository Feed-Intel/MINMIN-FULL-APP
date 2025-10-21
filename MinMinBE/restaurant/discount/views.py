from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from .models import Discount, DiscountRule, DiscountApplication, Coupon
from .serializers import DiscountSerializer, DiscountRuleSerializer, DiscountApplicationSerializer, CouponSerializer
from .dicountFilter import DiscountFilter, CouponFilter
from customer.order.models import Order
from .utils import apply_discounts
from accounts.permissions import HasCustomAPIKey, IsAdminOrRestaurant, IsAdminRestaurantOrBranch
from accounts.utils import get_user_branch, get_user_tenant
from .services import get_big_discount_items
from restaurant.menu_availability.serializers import MenuAvailabilitySerializer
from restaurant.tenant.models import Tenant
from core.cache import CachedModelViewSet

class DiscountPagination(PageNumberPagination):
    page_size = 10

class DiscountViewSet(CachedModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = DiscountFilter
    pagination_class = DiscountPagination
    # ordering = ['-valid_from']

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return Discount.objects.prefetch_related('branches', 'tenant')

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return Discount.objects.filter(tenant=tenant).prefetch_related('branches', 'tenant') if tenant else Discount.objects.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            return Discount.objects.filter(branch=branch).prefetch_related('branches', 'tenant') if branch else Discount.objects.none()

        return Discount.objects.none()
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

class DiscountRuleViewSet(CachedModelViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey, IsAdminRestaurantOrBranch]
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
            return DiscountRule.objects.select_related('discount_id')

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return DiscountRule.objects.filter(tenant=tenant).select_related('discount_id') if tenant else DiscountRule.objects.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            if not branch:
                return DiscountRule.objects.none()
            return DiscountRule.objects.filter(tenant=branch.tenant).select_related('discount_id')

        return DiscountRule.objects.none()
    
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
class DiscountApplicationViewSet(CachedModelViewSet):
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
            return DiscountApplication.objects.all()

        tenant = get_user_tenant(user)
        if user.user_type == 'restaurant' and tenant:
            return DiscountApplication.objects.filter(order__tenant=tenant)

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            return DiscountApplication.objects.filter(order__branch=branch) if branch else DiscountApplication.objects.none()

        return DiscountApplication.objects.none()


class CouponPagination(PageNumberPagination):
    page_size = 10
class CouponViewSet(CachedModelViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey, IsAdminRestaurantOrBranch]
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = CouponFilter
    ordering_fields = ['created_at', 'updated_at','valid_from', 'valid_until']
    ordering = ['-created_at']
    pagination_class = CouponPagination

    def perform_create(self, serializer):
        tenant = get_user_tenant(self.request.user)
        if tenant is None:
            raise PermissionDenied("Associated tenant not found for user")

        branch = get_user_branch(self.request.user)
        coupon = serializer.save(tenant=tenant)
        if branch and not coupon.is_global:
            coupon.branches.add(branch)
    
    def perform_update(self, serializer):
        tenant = get_user_tenant(self.request.user)
        if tenant is None:
            raise PermissionDenied("Associated tenant not found for user")

        branch = get_user_branch(self.request.user)
        coupon = serializer.save(tenant=tenant)
        if branch and not coupon.is_global:
            coupon.branches.add(branch)
        

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return Coupon.objects.all()

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return Coupon.objects.filter(tenant=tenant).distinct() if tenant else Coupon.objects.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            if not branch:
                return Coupon.objects.none()

            tenant = branch.tenant
            return Coupon.objects.filter(tenant=tenant).distinct()

        return Coupon.objects.none()
    


    
