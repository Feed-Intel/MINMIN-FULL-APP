from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import TableView

router = DefaultRouter()
router.register(r'table', TableView)

urlpatterns = [
    path('', include(router.urls)),
]
