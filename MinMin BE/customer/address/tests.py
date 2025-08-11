from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_api_key.models import APIKey
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Address
from accounts.models import User

class AddressViewSetTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="admin@test.com", password="password", user_type="admin")
        self.other_user = User.objects.create_user(email="otheruser@gmail.com", password="password", user_type="customer")

        self.address1 = Address.objects.create(
            user=self.user,
            address_line="123 Main St",
            label="home",
            is_default=True
        )

        self.address2 = Address.objects.create(
            user=self.user,
            address_line="456 Elm St",
            label="office"
        )

        self.other_address = Address.objects.create(
            user=self.other_user,
            address_line="789 Oak St",
            label="home"
        )


    def authenticate_user(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix, _, _ = key.partition(".")
        self.key = self.prefix + '.' + key
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_addresses(self):
        self.authenticate_user(self.user)
        response = self.client.get("/api/v1/address/")
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data["results"]), 3)

    def test_create_address(self):
        self.authenticate_user(self.other_user)
        data = {
            "user": str(self.other_user.id),
            "address_line": "999 Maple St",
            "label": "other",
            "is_default": False,
            "gps_coordinates": "12.3456789,98.7654321"
        }
        response = self.client.post("/api/v1/address/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Address.objects.filter(user=self.user).count(), 2)
        self.assertFalse(Address.objects.get(id=response.data["id"]).is_default)

    def test_update_address(self):
        self.authenticate_user(self.user)
        data = {
            "address_line": "123 Updated St",
        }
        response = self.client.patch(f"/api/v1/address/{self.address1.id}/", data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.address1.refresh_from_db()
        self.assertEqual(self.address1.address_line, "123 Updated St")

    def test_delete_address(self):
        self.authenticate_user(self.user)
        response = self.client.delete(f"/api/v1/address/{self.address1.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Address.objects.filter(user=self.user).count(), 1)

    def test_filter_by_label(self):
        self.authenticate_user(self.user)
        response = self.client.get("/api/v1/address/?label=home")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 2)
        self.assertEqual(data['results'][0]["label"], "home")

    def test_search_address(self):
        self.authenticate_user(self.user)
        response = self.client.get("/api/v1/address/?search=Main")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]["address_line"], "123 Main St")

    def test_unique_label_per_user(self):
        self.authenticate_user(self.user)
        data = {
            "address_line": "555 Pine St",
            "label": "home",
            "gps_coordinates": "10.3456789,98.7654321"
        }
        response = self.client.post("/api/v1/address/", data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("An address with label 'home' already exists for this user.", data.get('non_field_errors', []))

    def test_permissions(self):
        response = self.client.get(f"/api/v1/address/{self.address1.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

