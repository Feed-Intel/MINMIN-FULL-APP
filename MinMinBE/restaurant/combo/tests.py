from rest_framework.test import APIClient,APITestCase
from rest_framework import status
from accounts.models import User
from rest_framework_api_key.models import APIKey
from rest_framework_simplejwt.tokens import RefreshToken
from restaurant.combo.models import Combo,ComboItem
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
import json

class ComboViewTest(APITestCase):

    def setUp(self):
        self.tenant_user = User.objects.create_user(
            email="tenant@test.com", password="password", user_type="restaurant"
        )
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant", admin=self.tenant_user)
        self.branch = Branch.objects.create(tenant=self.tenant, address="123 Main St")
        self.menuItem = Menu.objects.create(
            name="Pizza",
            image='images/test_image.jpg',  # Assuming you want to set the image path
            tenant=self.tenant,
            description='Delicious breakfast',
            tags=['Breakfast'],
            categories=['Fast Food'],
            price=10.00
        )
        self.combo = Combo.objects.create(
            name="Lunch Special",
            tenant=self.tenant,
            branch=self.branch,
            is_custom=False,
            combo_price=19.99
        )
        self.combo_item = ComboItem.objects.create(
            combo=self.combo,
            menu_item=self.menuItem,
            quantity=2,
            is_half=True
        )
        self.client = APIClient()

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key) 
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_admin_can_access_all_combos(self):
        """Test that admin users can access all combos."""
        self.authenticate(self.tenant_user)
        response = self.client.get("/api/v1/combo/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), Combo.objects.count())

    def test_tenant_can_access_own_combos(self):
        """Test that tenant users can access only their own combos."""
        self.authenticate(self.tenant_user)
        response = self.client.get("/api/v1/combo/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), Combo.objects.filter(tenant=self.tenant).count())

    def test_create_combo(self):
        """Test that an authenticated admin user can create a combo."""
        self.authenticate(self.tenant_user)
        menuItem = Menu.objects.create(
            name="Pizza",
            image='images/test_image.jpg',  # Assuming you want to set the image path
            tenant=self.tenant,
            description='Delicious breakfast',
            tags=['Breakfast'],
            categories=['Fast Food'],
            price=10.00
        )
        payload = {
            "name": "Dinner Special",
            "tenant": str(self.tenant.id),
            "branch": str(self.branch.id),
            "combo_items": [{
                "menu_item": str(menuItem.id),
                "quantity": 2,
                "is_half": True
            }],
            "is_custom": True,
            "combo_price": 25.99
        }
        response = self.client.post("/api/v1/combo/", data=json.dumps(payload),  # Convert payload to JSON
    content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Combo.objects.count(), 2)

    def test_update_combo(self):
        """Test that an authenticated user can update a combo."""
        self.authenticate(self.tenant_user)
        payload = {"name": "Updated Combo"}
        response = self.client.patch(f"/api/v1/combo/{self.combo.id}/", payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.combo.refresh_from_db()
        self.assertEqual(self.combo.name, "Updated Combo")

    def test_delete_combo(self):
        """Test that an authenticated user can delete a combo."""
        self.authenticate(self.tenant_user)
        response = self.client.delete(f"/api/v1/combo/{self.combo.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Combo.objects.count(), 0)

