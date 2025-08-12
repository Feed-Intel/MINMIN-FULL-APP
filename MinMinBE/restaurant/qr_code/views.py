from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse
from django.db.models import Q

from alpha import settings
from .models import QRCode
from rest_framework.pagination import PageNumberPagination
from restaurant.table.models import Table
from .serializers import QRCodeSerializer
from .utils import generate_qr_code
from accounts.permissions import HasCustomAPIKey, IsAdminOrRestaurant
from core.cache import CachedModelViewSet

import os
import re
class QRCodeViewPagination(PageNumberPagination):
    page_size = 10

class QRCodeViewSet(CachedModelViewSet):
    """
    A ViewSet for viewing and editing QR code instances.
    """
    queryset = QRCode.objects.all()
    serializer_class = QRCodeSerializer
    permission_classes = [IsAuthenticated, HasCustomAPIKey, IsAdminOrRestaurant]
    pagination_class = QRCodeViewPagination

    # Add filter backends
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tenant', 'branch', 'table'] 
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        # Get the currently authenticated user
        user = self.request.user
        return QRCode.objects.filter(Q(branch__tenant__admin=user.id) | Q(branch=user.branch)).select_related('branch','table','tenant')

    def sanitize_filename(self, filename):
        """
        Removes invalid characters from filenames to ensure compatibility across filesystems.
        """
        import re
        # Replace invalid characters with underscores
        return re.sub(r'[<>:"/\\|?*\n]', '_', filename)

    def create(self, request, *args, **kwargs):
        try:
            table = Table.objects.get(pk=request.data.get('table'))
        except Table.DoesNotExist:
            return JsonResponse(
                {"error": f"Table with ID {request.data.get('table')} does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        tenant = table.branch.tenant
        branch = table.branch

        # Generate the URL
        base_url = settings.FRONTEND_BASE_URL
        if table:
            url = f"{base_url}/order?tenant={tenant.id}&branch={branch.id}&table={table.id}"
        else:
            url = f"{base_url}/menu?tenant={tenant.id}&branch={branch.id}"

        # Generate and save the QR code
        qr_code_file = generate_qr_code(url)

        # Sanitize folder and file names
        sanitized_tenant_name = self.sanitize_filename(str(tenant.restaurant_name))
        sanitized_branch_address = self.sanitize_filename(branch.address)

        folder_path = os.path.join(settings.MEDIA_ROOT, f"qr_codes/{sanitized_tenant_name}/{sanitized_branch_address}")
        os.makedirs(folder_path, exist_ok=True)

        file_name = f"{table.id or 'default'}.png"
        file_path = os.path.join(folder_path, file_name)
        with open(file_path, 'wb') as f:
            f.write(qr_code_file.read())

        # Create the QRCode instance
        qr_code_instance = QRCode.objects.create(
            tenant=tenant,  # Pass the Tenant instance
            branch=branch,  # Pass the Branch instance
            table=table,    # Pass the Table instance (or None)
            qr_code_url=os.path.join(settings.MEDIA_URL, f"qr_codes/{sanitized_tenant_name}/{sanitized_branch_address}/{file_name}"),
        )

        serializer = self.get_serializer(qr_code_instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

