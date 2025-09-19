from rest_framework import status
from django.core.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from .models import Menu
from .menuFilter import MenuFilter
from .serializers import MenuSerializer
from accounts.permissions import HasCustomAPIKey
from accounts.utils import get_user_branch, get_user_tenant
from core.cache import CachedModelViewSet

class MenuViewPagination(PageNumberPagination):
    page_size = 10

class MenuView(CachedModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = MenuFilter
    pagination_class = MenuViewPagination
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
    #     # Get the currently authenticated user
        user = self.request.user

        if user.user_type == 'customer':
            return Menu.objects.filter(
                menu_items_availabilities__is_available=True
            ).select_related('tenant').distinct()

        queryset = Menu.objects.select_related('tenant').distinct()

        if user.user_type == 'admin':
            return queryset

        tenant = get_user_tenant(user)
        if user.user_type == 'restaurant':
            return queryset.filter(tenant=tenant) if tenant else queryset.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            if tenant and branch:
                return queryset.filter(tenant=tenant, menu_items_availabilities__branch=branch).distinct()
            return queryset.none()

        return queryset.none()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response({"message": "Menu deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
