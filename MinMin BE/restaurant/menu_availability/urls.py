from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import MenuAvailabilityView

router = DefaultRouter()
router.register(r'menu-availability', MenuAvailabilityView)

urlpatterns = [
    path('', include(router.urls)),
]
