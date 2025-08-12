# urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiscountViewSet, DiscountRuleViewSet, DiscountApplicationViewSet,CouponViewSet

router = DefaultRouter()
router.register(r'discount', DiscountViewSet)
router.register(r'discount-rule', DiscountRuleViewSet)
router.register(r'discount-application', DiscountApplicationViewSet)
router.register(r'coupon', CouponViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
