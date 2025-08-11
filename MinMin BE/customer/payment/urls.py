from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentView, PaymentCheckView

router = DefaultRouter()
router.register(r'payment', PaymentView, basename='payments')
router.register(r'payment-check', PaymentCheckView)
urlpatterns = [
    path('', include(router.urls))
]
