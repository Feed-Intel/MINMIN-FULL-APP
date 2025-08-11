from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartView, CartItemView

router = DefaultRouter()
router.register(r'cart', CartView)
router.register(r'cart-item', CartItemView)

urlpatterns = [
    path('', include(router.urls)),
]
