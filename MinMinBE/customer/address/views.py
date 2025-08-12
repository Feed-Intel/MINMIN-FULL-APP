from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import PermissionDenied
from customer.address.addressFilter import AddressFilter
from accounts.permissions import IsAdminOrCustomer, HasCustomAPIKey
from .models import Address
from .serializers import AddressSerializer
from rest_framework.filters import SearchFilter
from django.core.cache import cache
from rest_framework.pagination import PageNumberPagination

class AddressPagination(PageNumberPagination):
    page_size = 10

class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, HasCustomAPIKey, IsAdminOrCustomer]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = AddressFilter
    search_fields = ['address_line', 'label']
    pagination_class = AddressPagination

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            addresses = Address.objects.select_related('user').all()
        else:
            addresses = Address.objects.filter(user=user).select_related('user')
        return addresses
    
    def retrieve(self, request, *args, **kwargs):
        if request.user != self.get_object().user and request.user.user_type != 'admin':
            raise PermissionDenied("You do not have permission to view this object.")
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        address = serializer.save(user=self.request.user)
        self.clear_cache(self.request.user.id)  # Clear cache on create
        return address

    def perform_update(self, serializer):
        if self.request.user != self.get_object().user and self.request.user.user_type != 'admin':
            raise PermissionDenied("You do not have permission to view this object.")
        address = serializer.save()
        self.clear_cache(self.request.user.id)  # Clear cache on update
        return address



    def perform_destroy(self, instance):
        user_id = instance.user.id
        if self.request.user.id != user_id:
            raise PermissionDenied("You do not have permission to delete this object.")
        instance.delete()
        self.clear_cache(user_id)  # Clear cache on delete


    def clear_cache(self, user_id):
        cache_key = f"addresses_{user_id}"
        cache.delete(cache_key)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)