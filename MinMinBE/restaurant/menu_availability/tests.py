from django.test import TestCase
from rest_framework import status
from restaurant.menu_availability.models import MenuAvailability, Branch, Menu
from rest_framework.test import APIClient
from rest_framework_api_key.models import APIKey
from accounts.models import User
from restaurant.tenant.models import Tenant
from rest_framework_simplejwt.tokens import RefreshToken
from uuid import UUID


class MenuAvailabilityViewTest(TestCase):
    def setUp(self):
        # Create a test user and assign token
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="password", user_type="restaurant"
        )
        # # refresh = RefreshToken.for_user(self.user)
        # self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create sample data
        self.client = APIClient()
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant",admin=self.admin_user)
        self.branch = Branch.objects.create(address="123 Main St", tenant=self.tenant)
        self.menu_item = Menu.objects.create(
            name="Test Menu Item",
            tenant=self.tenant,
            image="images/test_image.jpg",
            description="Test description",
            tags=["tag1", "tag2"],
            category="Main Course", 
            price=10.00,
            is_side=False, 
        )
        self.menu_availability = MenuAvailability.objects.create(
            branch=self.branch,
            menu_item=self.menu_item,
            is_available=True,
            special_notes="Available for testing."
        )
        self.valid_payload = {
            "branch": self.branch.id,
            "menu_item": self.menu_item.id,
            "is_available": False,
            "special_notes": "Updated note."
        }

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")  # Extract the prefix from the key
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_get_menu_availability_list(self):
        """Test retrieving a list of MenuAvailability."""
        self.authenticate(self.admin_user)
        response = self.client.get("/api/v1/menu-availability/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_single_menu_availability(self):
        """Test retrieving a single MenuAvailability by ID."""
        self.authenticate(self.admin_user)
        response = self.client.get(f"/api/v1/menu-availability/{self.menu_availability.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.menu_availability.id))

    def test_create_menu_availability(self):
        """Test creating a new MenuAvailability."""
        self.authenticate(self.admin_user)
        response = self.client.post("/api/v1/menu-availability/", self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["is_available"], False)
        self.assertEqual(response.data["special_notes"], "Updated note.")

    def test_update_menu_availability(self):
        """Test updating an existing MenuAvailability."""
        self.authenticate(self.admin_user)
        response = self.client.put(
            f"/api/v1/menu-availability/{self.menu_availability.id}/",
            self.valid_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.menu_availability.refresh_from_db()
        self.assertEqual(self.menu_availability.is_available, False)
        self.assertEqual(self.menu_availability.special_notes, "Updated note.")

    def test_delete_menu_availability(self):
        """Test deleting a MenuAvailability."""
        self.authenticate(self.admin_user)
        response = self.client.delete(f"/api/v1/menu-availability/{self.menu_availability.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MenuAvailability.objects.filter(id=self.menu_availability.id).exists())

