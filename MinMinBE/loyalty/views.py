from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from rest_framework.pagination import PageNumberPagination
from restaurant.tenant.models import Tenant
from .serializers import CustomerLoyaltySerializer, RestaurantLoyaltySerializer, LoyaltyTransactionSerializer,LoyaltyConversionRateSerializer,GlobalLoyaltySettingsSerializer,RestaurantLoyaltySettingsSerializer
from .models import CustomerLoyalty, TenantLoyalty, LoyaltyTransaction,LoyaltyConversionRate,GlobalLoyaltySettings,RestaurantLoyaltySettings
from accounts.permissions import HasCustomAPIKey,IsAdminOrRestaurant, IsAdminOrCustomer,IsAdmin

class GlobalLoyaltySettingsPagination(PageNumberPagination):
    page_size = 10

class GlobalLoyaltySettingsViewSet(ModelViewSet):
    queryset = GlobalLoyaltySettings.objects.all()
    serializer_class = GlobalLoyaltySettingsSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter,IsAdmin]
    filterset_fields = ['event','global_points']
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    pagination_class = GlobalLoyaltySettingsPagination

    def get_queryset(self):
        global_loyalty_settings = GlobalLoyaltySettings.objects.all()
        return global_loyalty_settings
    
class RestaurantLoyaltySettingsPagination(PageNumberPagination):
    page_size = 10

class RestaurantLoyaltySettingsViewSet(ModelViewSet):
    queryset = RestaurantLoyaltySettings.objects.all()
    serializer_class = RestaurantLoyaltySettingsSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tenant', 'threshold']
    permission_classes = [IsAuthenticated,HasCustomAPIKey,IsAdminOrRestaurant]
    pagination_class = RestaurantLoyaltySettingsPagination

    def get_queryset(self):
        user = self.request.user
        tenant = Tenant.objects.get(admin=user)
        restaurant_loyalty_settings = RestaurantLoyaltySettings.objects.filter(tenant=tenant)
        return restaurant_loyalty_settings


class LoyaltyPagination(PageNumberPagination):
    page_size = 10

class CustomerLoyaltyViewSet(ModelViewSet):
    queryset = CustomerLoyalty.objects.all()
    serializer_class = CustomerLoyaltySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['customer','global_points']
    permission_classes = [IsAuthenticated,HasCustomAPIKey,IsAdminOrCustomer]
    pagination_class = LoyaltyPagination

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            customer_loyalty = CustomerLoyalty.objects.select_related('customer').all()
        else:
            customer_loyalty = CustomerLoyalty.objects.filter(customer=user).select_related('customer')
        return customer_loyalty
    
    def create(self, request, *args, **kwargs): 
        if request.user.user_type == 'admin':
            return super().create(request, *args, **kwargs)
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

class RestaurantLoyaltyPagination(PageNumberPagination):
    page_size = 10

class RestaurantLoyaltyViewSet(ModelViewSet):
    queryset = TenantLoyalty.objects.all()
    serializer_class = RestaurantLoyaltySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tenant', 'customer','points']
    permission_classes = [IsAuthenticated,HasCustomAPIKey,IsAdminOrRestaurant]
    pagination_class = RestaurantLoyaltyPagination

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            restaurant_loyalty = TenantLoyalty.objects.select_related('tenant','customer').all()
        else:
            restaurant_loyalty = TenantLoyalty.objects.filter(tenant=user).select_related('tenant')
        return restaurant_loyalty
    def create(self, request, *args, **kwargs): 
        if request.user.user_type == 'admin':
            return super().create(request, *args, **kwargs)
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

class LayaltyConversionRatePagination(PageNumberPagination):
    page_size = 10

class LoyaltyConversionRateViewSet(ModelViewSet):
    queryset = LoyaltyConversionRate.objects.all()
    serializer_class = LoyaltyConversionRateSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tenant', 'global_to_restaurant_rate']
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    pagination_class = LayaltyConversionRatePagination

    def get_queryset(self):
        user = self.request.user
        tenant = Tenant.objects.get(admin=user)
        loyalty_conversion_rate = LoyaltyConversionRate.objects.filter(tenant=tenant).select_related('tenant')
        if loyalty_conversion_rate.count() == 0:
            LoyaltyConversionRate.objects.create(tenant=tenant, global_to_restaurant_rate=0)
            loyalty_conversion_rate = LoyaltyConversionRate.objects.filter(tenant=tenant).select_related('tenant')
        return loyalty_conversion_rate
    def create(self, request, *args, **kwargs): 
        if request.user.user_type == 'admin':
            return super().create(request, *args, **kwargs)
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

class LoyaltyTransactionViewSet(ModelViewSet):
    queryset = LoyaltyTransaction.objects.all()
    serializer_class = LoyaltyTransactionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tenant', 'customer','points','transaction_type']
    permission_classes = [IsAuthenticated,HasCustomAPIKey]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            loyalty_transaction = LoyaltyTransaction.objects.all()
        else:
            loyalty_transaction = LoyaltyTransaction.objects.filter(customer=user).all()
        return loyalty_transaction
    def create(self, request, *args, **kwargs): 
        if request.user.user_type == 'admin':
            return super().create(request, *args, **kwargs)
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
