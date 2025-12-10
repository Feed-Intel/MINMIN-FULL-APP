from rest_framework import status
from django.core.exceptions import ValidationError
from accounts.permissions import HasCustomAPIKey
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Branch
from .serializers import BranchSerializer
from .branchFilter import BranchFilter
from rest_framework.pagination import PageNumberPagination
from django.contrib.gis.geos import Point # Import Point
from django.contrib.gis.db.models.functions import Distance
from core.redis_client import redis_client
from rest_framework.decorators import action
from restaurant.table.models import Table
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from accounts.utils import get_user_branch, get_user_tenant

class BranchPagination(PageNumberPagination):
    page_size = 10

class BranchView(ModelViewSet):
    permission_classes = [IsAuthenticated,HasCustomAPIKey]
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = BranchFilter
    pagination_class = BranchPagination

    def get_queryset(self):
        user = self.request.user

        user_location = redis_client.get(str(user.id))
        if user.user_type == 'customer':
            base_qs = Branch.objects.prefetch_related('tables', 'branch_menu_availabilities')
            if user_location:
                latitude_str, longitude_str = user_location.split(',')
                if latitude_str != 'null' and longitude_str != 'null':
                    latitude = float(latitude_str)
                    longitude = float(longitude_str)
                    user_point = Point(longitude, latitude, srid=4326)
                    base_qs = base_qs.annotate(distance=Distance('location', user_point)).order_by('distance')
            return base_qs

        queryset = Branch.objects.select_related('tenant').prefetch_related('tables', 'branch_menu_availabilities')

        if user.user_type == 'admin':
            return queryset

        if user.user_type == 'restaurant':
            tenant = get_user_tenant(user)
            return queryset.filter(tenant=tenant) if tenant else queryset.none()

        if user.user_type == 'branch':
            branch = get_user_branch(user)
            return queryset.filter(pk=branch.pk) if branch else queryset.none()

        return queryset.none()
    
    def get_paginated_response(self, data):
        # If 'nopage' query param is set, return unpaginated data
        if self.request.query_params.get('nopage') == '1':
            return Response(data)
        return super().get_paginated_response(data)

    def paginate_queryset(self, queryset):
        # If 'nopage' query param is set, skip pagination
        if self.request.query_params.get('nopage') == '1':
            return None
        return super().paginate_queryset(queryset)

    @action(detail=False, methods=['post'], url_path='call_waiter', permission_classes=[IsAuthenticated])
    def call_waiter(self, request):
        """Allow any authenticated user (including customers) to call waiter using table_id"""
        table_id = request.data.get('table_id')

        if not table_id:
            return Response({'error': 'table_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            table = Table.objects.get(id=table_id)
            branch = table.branch
        except Table.DoesNotExist:
            return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)

        # Send real-time notification to branch's tenant group
        channel_layer = get_channel_layer()
        group_name = str(branch.tenant.id)

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Waiter Call",
                    "branch_id": str(branch.id),
                    "table_id": str(table.id),
                    "message": f"Table {table.table_code or table.id} requests assistance."
                }
            }
        )

        return Response({'message': 'Waiter notified'}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response({"message": "Branch deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby_branches(self, request):
        """
        Returns the 5 nearest branches based on user's GPS coordinates.
        Expects 'lat' and 'lon' query parameters.
        """
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        # Validate presence of parameters
        if not lat or not lon:
            return Response(
                {'error': 'Latitude (lat) and Longitude (lon) parameters are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate parameter types
        try:
            user_lat = float(lat)
            user_lon = float(lon)
            user_location = Point(user_lon, user_lat, srid=4326) # Create a Point object
        except ValueError:
            return Response(
                {'error': 'Invalid latitude or longitude values.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve all branches and annotate distance using Django GIS
        # Filter out branches without GPS coordinates if necessary, or handle nulls
        branches = Branch.objects.filter(location__isnull=False).annotate(
            distance=Distance('location', user_location)
        ).order_by('distance')[:5] # Order and limit directly in the queryset

        # The serializer should now correctly handle the 'distance' attribute
        # and the 'location' PointField via the SerializerMethodField.
        serializer = self.get_serializer(branches, many=True)
        return Response(serializer.data)

    # Removed the custom haversine function as Django GIS Distance handles this better.
    # @staticmethod
    # def haversine(lat1, lon1, lat2, lon2):
    #     # ... (redundant now)
    #     pass

    # Re-enabled (and corrected) all_branches_with_distance
    @action(detail=False, methods=['get'], url_path='all-with-distance')
    def all_branches_with_distance(self, request):
        """
        Returns all branches with distance in kilometers from user's location.
        Requires 'lat' and 'lon' query parameters.
        """
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')

        # Validate parameters
        if not lat or not lon:
            return Response(
                {'error': 'Both latitude (lat) and longitude (lon) are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_lat = float(lat)
            user_lon = float(lon)
            user_location = Point(user_lon, user_lat, srid=4326) # Create a Point object
        except ValueError:
            return Response(
                {'error': 'Invalid coordinate format. Use decimal degrees.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get tenant-filtered branches and annotate distance using Django GIS
        # Ensure only branches with valid location are included in distance calculation
        branches = self.get_queryset().filter(location__isnull=False).annotate(
            distance=Distance('location', user_location)
        ).order_by('distance') # Order by distance

        # Serialize with distance information
        serializer = self.get_serializer(branches, many=True)
        return Response(serializer.data)
