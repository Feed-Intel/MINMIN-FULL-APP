from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import CustomerLoyaltyViewSet, RestaurantLoyaltySettingsViewSet, LoyaltyConversionRateViewSet, LoyaltyTransactionViewSet

router = DefaultRouter()
router.register(r'customer-loyalty', CustomerLoyaltyViewSet, basename='customer_loyalty')
router.register(r'restaurant-loyalty-settings', RestaurantLoyaltySettingsViewSet, basename='restaurant_loyalty_settings')
router.register(r'loyalty-conversion-rate', LoyaltyConversionRateViewSet, basename='loyalty_conversion_rate')
router.register(r'loyalty-transaction', LoyaltyTransactionViewSet, basename='loyalty_transaction')

urlpatterns = [
    path('', include(router.urls)),
]