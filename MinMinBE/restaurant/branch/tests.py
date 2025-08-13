from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_api_key.models import APIKey
from rest_framework import status
from accounts.models import User
from restaurant.branch.models import Branch
from restaurant.tenant.models import Tenant

class BranchViewTest(TestCase):

    def setUp(self):
        # Create users and tenants
        self.admin_user = User.objects.create_user(
             email="admin@test.com", password="password", user_type="admin"
        )
        self.tenant_user = User.objects.create_user(
            email="tenant@test.com", password="password", user_type="restaurant"
        )
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant", admin=self.tenant_user,profile="test")

        self.customer_user = User.objects.create_user(
            email="customer@test.com", password="password"
        )
        self.branch1 = Branch.objects.create(
            tenant=self.tenant, address="123 Main St", is_default=True
        )
        self.branch2 = Branch.objects.create(
            tenant=self.tenant, address="456 Elm St", is_default=False
        )

        self.client = APIClient()
    
    def authenticate(self, user, password="password"):
        _, key = APIKey.objects.create_key(name="Test API Key")
        prefix, _, _ = key.partition(".")
        api_key = f"{prefix}.{key}"
        self.client.credentials(HTTP_X_API_KEY=api_key)
        response = self.client.post(
            "/api/auth/login/",
            {"email": user.email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        access_token = response.data["access_token"]
        self.client.credentials(
            HTTP_X_API_KEY=api_key,
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
        )

    def test_admin_can_access_all_branches(self):
        """Test that admin users can access all branches."""
        self.authenticate(self.tenant_user)
        response = self.client.get("/api/v1/branch/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), Branch.objects.count())

    def test_tenant_can_access_own_branches(self):
        """Test that tenant users can access only their own branches."""
        self.authenticate(self.tenant_user)
        response = self.client.get("/api/v1/branch/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), Branch.objects.filter(tenant=self.tenant).count())

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access branches."""
        response = self.client.get("/api/v1/branch/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_branch(self):
        """Test that an authenticated admin user can create a branch."""
        self.authenticate(user=self.tenant_user)
        payload = {
            "address": "789 Pine St",
            "gps_coordinates": "222.333, 444.555",
            "is_default": False
        }
        response = self.client.post("/api/v1/branch/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Branch.objects.count(), 3)

    def test_update_branch(self):
        """Test that an authenticated user can update a branch."""
        self.authenticate(user=self.admin_user)
        payload = {"address": "Updated Address"}
        response = self.client.patch(f"/api/v1/branch/{self.branch1.id}/", payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.branch1.refresh_from_db()
        self.assertEqual(self.branch1.address, "Updated Address")

    def test_delete_branch(self):
        """Test that an authenticated user can delete a branch."""
        self.authenticate(user=self.admin_user)
        response = self.client.delete(f"/api/v1/branch/{self.branch1.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Branch.objects.count(), 1)

