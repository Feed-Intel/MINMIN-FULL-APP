from rest_framework.permissions import BasePermission
from rest_framework_api_key.models import APIKey


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'customer'

class IsRestaurant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'restaurant'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'admin'
    
class IsAdminOrRestaurant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.user_type == 'admin' or request.user.user_type == 'restaurant')
class IsAdminOrCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.user_type == 'admin' or request.user.user_type == 'customer')


class HasCustomAPIKey(BasePermission):
    """
    Custom permission class that checks for an API key in the X-API-KEY header.
    """

    def has_permission(self, request, view):
        # Retrieve the API key from the request headers
        api_key = request.headers.get("X-API-KEY")
        if not api_key:
            return False

        # Split the API key into prefix and key
        prefix, _, key = api_key.partition(".")
        if not prefix or not key:
            return False

        # Retrieve the APIKey object using the prefix
        try:
            api_key_obj = APIKey.objects.get(prefix=prefix)
        except APIKey.DoesNotExist:
            return False

        # Validate the key and check if it's not revoked
        return api_key_obj.is_valid(key) and not api_key_obj.revoked

