from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from restaurant.branch.models import Branch
from restaurant.table.models import Table
from restaurant.tenant.models import Tenant
from rest_framework_api_key.models import APIKey
from accounts.models import User

class TableViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="password", user_type="restaurant"
        )
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant",admin=self.admin_user,profile="A test profile description.")
        self.branch = Branch.objects.create(tenant=self.tenant, address="123 Test St.",gps_coordinates="12.3456789,98.7654321")
        self.table = Table.objects.create(
            branch=self.branch,
            is_fast_table=True,
            is_delivery_table=False,
            is_inside_table=True
        )
    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_tables(self):
        self.authenticate(self.admin_user)
        response = self.client.get('/api/v1/table/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 1)

    def test_create_table(self):
        self.authenticate(self.admin_user)
        data = {
            "branch": self.branch.id,
            "is_fast_table": False,
            "is_delivery_table": True,
            "is_inside_table": False
        }
        response = self.client.post('/api/v1/table/', data)
        print(response.json())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["is_fast_table"], False)
        self.assertEqual(response.data["is_delivery_table"], True)

    def test_retrieve_table(self):
        self.authenticate(self.admin_user)
        response = self.client.get(f'/api/v1/table/{self.table.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.table.id))

    def test_update_table(self):
        self.authenticate(self.admin_user)
        data = {"is_delivery_table": True}
        response = self.client.patch(f'/api/v1/table/{self.table.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["is_delivery_table"], True)

    def test_delete_table(self):
        self.authenticate(self.admin_user)
        response = self.client.delete(f'/api/v1/table/{self.table.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_tables_by_branch(self):
        self.authenticate(self.admin_user)
        response = self.client.get('/api/v1/table/?branch=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 1)

    def test_filter_tables_by_is_fast_table(self):
        self.authenticate(self.admin_user)
        response = self.client.get('/api/v1/table/?is_fast_table=True')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 1)
