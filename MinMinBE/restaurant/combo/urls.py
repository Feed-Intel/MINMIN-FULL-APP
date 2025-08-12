from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComboView,ComboItemView

router = DefaultRouter()
router.register(r'combo', ComboView, basename='combos')
router.register(r'combo-item', ComboItemView, basename='combo-items')

urlpatterns = [
    path('', include(router.urls)),
]
