import json
from rest_framework import status
from rest_framework.response import Response
from django.db.models import Q, Prefetch, Avg, Count # Import Avg, Count for potential future use
from .models import MenuAvailability # Assuming your models are in the current app
from .serializers import MenuAvailabilitySerializer
from accounts.permissions import HasCustomAPIKey # Assuming this is correctly implemented
from django.contrib.gis.geos import Point
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.db.models.functions import Distance
from rest_framework.permissions import IsAuthenticated
import uuid
from rest_framework.decorators import action
from core.redis_client import redis_client # Your existing Redis client (assuming it's a django-redis client)
from .menuavailability_filter import MenuAvailabilityFilter # Your existing filter
from .services import get_best_dishes_of_week, get_recommended_items # Your existing services
from feed.models import Post # Assuming Post model is in 'feed' app
from customer.feedback.models import Feedback # Assuming Feedback model is in 'customer.feedback' app
from accounts.utils import get_user_branch, get_user_tenant

# Caching imports
from django.core.cache import cache 
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from core.cache import CachedModelViewSet

# Define cache timeouts
CACHE_TIMEOUT_LIST_QS_SECONDS = 60 * 5 # 5 minutes for main queryset
CACHE_TIMEOUT_STATIC_ACTIONS_SECONDS = 60 * 60 * 24 # 24 hours for best dishes/recommended
CACHE_TIMEOUT_CATEGORIES_SECONDS = 60 * 60 # 1 hour for categories

class MenuAvailabilityViewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class MenuAvailabilityView(CachedModelViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey]
    queryset = MenuAvailability.objects.all()
    serializer_class = MenuAvailabilitySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = MenuAvailabilityFilter
    pagination_class = MenuAvailabilityViewPagination

    def get_queryset(self):
        user = self.request.user

        # Base queryset for all users
        base_queryset = MenuAvailability.objects.all()

        if user.user_type == 'customer':
            # --- Customer-specific QuerySet Logic with Caching ---
            user_location_str = redis_client.get(str(user.id)) # Ensure user.id is stringified here if it's a UUID

            cache_key_parts = [
                f"menu_availability_qs_customer:{str(user.id)}", # Ensure user.id is a string
                f"loc:{user_location_str or 'none'}",
            ]
            
            # Incorporate filterset parameters into the cache key
            filter_params = self.request.query_params.dict()
            filter_params.pop('page', None)
            filter_params.pop('page_size', None)
            
            if filter_params:
                class UUIDEncoder(json.JSONEncoder):
                    def default(self, obj):
                        if isinstance(obj, uuid.UUID):
                            return str(obj)
                        return json.JSONEncoder.default(self, obj)

                sorted_filter_params = json.dumps(sorted(filter_params.items()), cls=UUIDEncoder)
                cache_key_parts.append(f"filters:{sorted_filter_params}")
            
            # The final cache key
            cache_key = ":".join(cache_key_parts)

            # Try fetching primary keys from cache
            cached_pks_json = cache.get(cache_key)

            if cached_pks_json:
                cached_pks = json.loads(cached_pks_json)
                
                queryset = base_queryset.filter(pk__in=cached_pks).select_related(
                    'menu_item', 'branch', 'branch__tenant', 'branch__tenant__admin'
                ).prefetch_related(
                    Prefetch(
                        'branch__tenant__admin__posts',
                        queryset=Post.objects.order_by('-time_ago')[:10],
                        to_attr='prefetched_posts'
                    ),
                    Prefetch(
                        'branch__tenant__restaurant_feedbacks',
                        queryset=Feedback.objects.order_by('-created_at')[:10],
                        to_attr='prefetched_feedbacks'
                    )
                ).distinct()
                return queryset

            # If not in cache, build the queryset from scratch
            queryset = base_queryset.filter(is_available=True).select_related(
                'menu_item', 'branch', 'branch__tenant', 'branch__tenant__admin'
            ).prefetch_related(
                Prefetch(
                    'branch__tenant__admin__posts',
                    queryset=Post.objects.order_by('-time_ago')[:10],
                    to_attr='prefetched_posts'
                ),
                Prefetch(
                    'branch__tenant__restaurant_feedbacks',
                    queryset=Feedback.objects.order_by('-created_at')[:10],
                    to_attr='prefetched_feedbacks'
                )
            ).distinct()

            # Apply user location distance annotation if available and valid
            if user_location_str:
                try:
                    latitude_str, longitude_str = user_location_str.split(',')
                    if latitude_str not in ('null', 'None') and longitude_str not in ('null', 'None'):
                        latitude = float(latitude_str)
                        longitude = float(longitude_str)
                        user_location_point = Point(longitude, latitude, srid=4326)
                        queryset = queryset.annotate(distance=Distance('branch__location', user_location_point))
                except (ValueError, TypeError):
                    pass

            # Cache the primary keys for later retrieval
            # Ensure PKs are converted to strings if they are UUIDs before dumping to JSON
            pks = [str(pk) for pk in queryset.values_list('pk', flat=True)] # Convert all PKs to strings
            cache.set(cache_key, json.dumps(pks), CACHE_TIMEOUT_LIST_QS_SECONDS)
            
            return queryset.order_by('-created_at')
            
        else:
            queryset = base_queryset.none()

            if user.user_type == 'admin':
                queryset = base_queryset
            elif user.user_type == 'restaurant':
                tenant = get_user_tenant(user)
                if tenant:
                    tenant_availabilities = base_queryset.filter(branch__tenant=tenant)
                    queryset = tenant_availabilities.order_by('menu_item', '-created_at').distinct('menu_item')
            elif user.user_type == 'branch':
                branch = get_user_branch(user)
                if branch:
                    queryset = base_queryset.filter(branch=branch)

            queryset = queryset.select_related('menu_item', 'branch').distinct()
            return queryset.order_by('-created_at')

    # --- Cache Invalidation Helpers ---
    def invalidate_menu_availability_cache(self, instance=None):
        """
        Invalidates relevant MenuAvailability caches.
        More granular invalidation based on instance properties can be added.
        """
        # Clear all user-specific queryset caches
        # For simplicity, we clear all 'menu_availability_qs_customer:*' keys.
        # In a very high-traffic system, you might refine this to only clear
        # caches affected by the specific instance's change (e.g., specific branch's items).
        
        # Note: 'scan_iter' is efficient for finding keys matching a pattern
        # This will iterate and delete keys related to all customer querysets
        for key in redis_client.scan_iter("menu_availability_qs_customer:*"):
            redis_client.delete(key)
        
        # Invalidate specific action caches
        cache.delete("best_dishes")
        cache.delete("recommended_items")
        cache.delete("available_categories")
        print(f"Cache invalidated for MenuAvailability and related actions.")

    # --- Override DRF methods to trigger cache invalidation ---
    def perform_create(self, serializer):
        super().perform_create(serializer)
        # Invalidate cache after creation
        self.invalidate_menu_availability_cache(serializer.instance)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        # Invalidate cache after update
        self.invalidate_menu_availability_cache(serializer.instance)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        # Invalidate cache after deletion
        self.invalidate_menu_availability_cache(instance)

    # --- Action specific endpoints with method decorators for caching ---
    @method_decorator(cache_page(CACHE_TIMEOUT_STATIC_ACTIONS_SECONDS, key_prefix="best_dishes"))
    @action(detail=False, methods=['get'])
    def best_dishes_of_week(self, request):
        """
        API endpoint for retrieving the best dishes of the week.
        """
        best_dishes = get_best_dishes_of_week() # Assuming this service handles its own data fetching/caching
        serializer = self.get_serializer(best_dishes, many=True)
        return Response(serializer.data)

    @method_decorator(cache_page(CACHE_TIMEOUT_STATIC_ACTIONS_SECONDS, key_prefix="recommended_items"))
    @action(detail=False, methods=['get'])
    def recommended_items(self, request):
        """
        API endpoint for retrieving recommended menu items (fake loading).
        """
        fake_recommended = get_recommended_items() # Assuming this service handles its own data fetching/caching
        serializer = self.get_serializer(fake_recommended, many=True)
        return Response(serializer.data)

    @method_decorator(cache_page(CACHE_TIMEOUT_CATEGORIES_SECONDS, key_prefix="available_categories"))
    @action(detail=False, methods=['get'])
    def available_categories(self, request):
        """
        API endpoint to retrieve all distinct categories of available menu items.
        """
        # Note: This query benefits from indexing on 'is_available'.
        queryset = self.filter_queryset(self.get_queryset())
        
        raw_category_lists = queryset.filter(is_available=True).values_list(
            'menu_item__categories', flat=True
        )

        unique_categories = sorted({
            category
            for category_list in raw_category_lists
            if isinstance(category_list, (list, tuple))
            for category in category_list
            if category
        })

        return Response({'categories': unique_categories})

    # --- Permission checks for update/destroy ---
    def update(self, request, *args, **kwargs):
        if request.user.user_type == 'branch' or request.user.user_type == 'customer':
            return Response({'error': 'You do not have permission to update this resource'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if request.user.user_type == 'branch' or request.user.user_type == 'customer':
            return Response({'error': 'You do not have permission to delete this resource'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
