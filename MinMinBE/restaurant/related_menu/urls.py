from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RelatedMenuItemView

router = DefaultRouter()
router.register(r'related-menu', RelatedMenuItemView)

urlpatterns = [
    path('', include(router.urls)),
]
