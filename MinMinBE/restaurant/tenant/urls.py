from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import TenantView,DashboardViewSet

router = DefaultRouter()
router.register(r'tenant', TenantView)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
