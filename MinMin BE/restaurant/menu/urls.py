from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import MenuView

router = DefaultRouter()
router.register(r'menu', MenuView)

urlpatterns = [
    path('', include(router.urls)),
]
