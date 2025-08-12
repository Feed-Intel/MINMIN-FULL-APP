from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import BranchView

router = DefaultRouter()
router.register(r'branch', BranchView, basename='branches')

urlpatterns = [
    path('', include(router.urls)),
]
