from rest_framework import viewsets, status
from django.core.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.core.cache import cache 
from rest_framework.pagination import PageNumberPagination
from .models import Menu
from .menuFilter import MenuFilter
from .serializers import MenuSerializer
from accounts.permissions import HasCustomAPIKey

class MenuViewPagination(PageNumberPagination):
    page_size = 10

class MenuView(viewsets.ModelViewSet):
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
        user_branch_tenant = None
        if user.branch:
            user_branch_tenant = user.branch.tenant
        if user.user_type == 'customer':
            queryset = Menu.objects.filter(menu_items_availabilities__is_available=True).select_related('tenant').distinct()
        else:
            queryset = Menu.objects.filter(Q(tenant__admin=user.id) | Q(tenant=user_branch_tenant)).select_related('tenant').distinct()
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response({"message": "Menu deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
