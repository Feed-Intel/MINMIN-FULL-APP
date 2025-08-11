from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework_api_key.models import APIKey
from django.urls import reverse
from accounts.models import User
from restaurant.tenant.models import Tenant

class TenantViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="password", user_type="admin"
        )
        self.tenant_user = User.objects.create_user(
            email="tenant@test.com", password="password", user_type="restaurant")
        
        self.tenant = Tenant.objects.create(
            restaurant_name="Test Restaurant",
            profile="A test profile description.",
            admin=self.tenant_user
        )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_tenants_as_admin(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('tenant-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 1)

    def test_list_tenants_as_restaurant_user(self):
        self.authenticate(self.tenant_user)
        response = self.client.get(reverse('tenant-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 1)

    def test_create_tenant(self):
        self.authenticate(self.admin_user)
        data = {
            "restaurant_name": "New Restaurant",
            "profile": "A new restaurant profile.",
            "admin": self.admin_user.id
        }
        response = self.client.post(reverse('tenant-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["restaurant_name"], "New Restaurant")
        self.assertEqual(str(response.data["admin"]), str(self.admin_user.id))

    def test_retrieve_tenant(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('tenant-detail', args=[self.tenant.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.tenant.id))

    def test_update_tenant(self):
        self.authenticate(self.admin_user)
        data = {"restaurant_name": "Updated Restaurant"}
        response = self.client.patch(reverse('tenant-detail', args=[self.tenant.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["restaurant_name"], "Updated Restaurant")

    def test_delete_tenant(self):
        self.authenticate(self.admin_user)
        response = self.client.delete(reverse('tenant-detail', args=[self.tenant.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_tenants_by_admin(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('tenant-list') + f"?admin={self.admin_user.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 0)

    def test_unauthenticated_access(self):
        response = self.client.get(reverse('tenant-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

