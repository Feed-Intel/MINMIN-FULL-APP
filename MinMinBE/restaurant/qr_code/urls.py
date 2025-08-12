from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import QRCodeViewSet as QRCodeView

router = DefaultRouter()
router.register(r'qr-code', QRCodeView)

urlpatterns = [
    path('', include(router.urls)),
]
