from django.core.cache import cache
from rest_framework import viewsets
from rest_framework.response import Response


class CachedModelViewSet(viewsets.ModelViewSet):
    """ModelViewSet with basic per-user response caching for GET requests."""
    cache_timeout = 300  # seconds

    def _cache_key(self, request, *args, **kwargs):
        user_id = getattr(request.user, 'id', 'anon')
        return f"{user_id}:{request.get_full_path()}"

    def list(self, request, *args, **kwargs):
        key = self._cache_key(request, *args, **kwargs)
        data = cache.get(key)
        if data is not None:
            return Response(data)
        response = super().list(request, *args, **kwargs)
        cache.set(key, response.data, self.cache_timeout)
        return response

    def retrieve(self, request, *args, **kwargs):
        key = self._cache_key(request, *args, **kwargs)
        data = cache.get(key)
        if data is not None:
            return Response(data)
        response = super().retrieve(request, *args, **kwargs)
        cache.set(key, response.data, self.cache_timeout)
        return response
