from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_api_key.models import APIKey
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from .models import Discount, Order, Tenant, Branch,DiscountRule
from restaurant.table.models import Table

class DiscountViewSetTestCase(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = User.objects.create_user(email="admin@example.com", user_type="admin", password="admin123")
        self.customer_user = User.objects.create_user(email="customer@example.com", user_type="customer", password="customer123")

        # Create test tenant and branch
        self.tenant = Tenant.objects.create(restaurant_name="Test Restaurant", admin=self.admin_user,profile="Test Profile")
        self.branch = Branch.objects.create(tenant=self.tenant, address="Test Address", gps_coordinates="Test GPS Coordinates")

        # Create test discounts
        self.discount = Discount.objects.create(
            tenant=self.tenant,
            branch=self.branch,
            type="volume",
            priority=1,
            is_stackable=True
        )

        self.discount_rule = DiscountRule.objects.create(
            discount_id=self.discount,
            tenant = self.tenant,
            min_items=1,
            max_items=10,
            min_price=10.00,
            applicable_items=[1, 2, 3],
            excluded_items=[4, 5, 6],
            combo_size=3,
            buy_quantity=1,
            get_quantity=1,
            is_percentage=False,
            max_discount_amount=10.00
        )

        # Create test orders
        self.branch = Branch.objects.create(tenant=self.tenant, address="123 Main St")
        self.table = Table.objects.create(branch=self.branch)
        self.order = Order.objects.create(
            tenant=self.tenant,
            branch=self.branch,
            table=self.table,
            customer=self.customer_user,
            status='placed',
        )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_discounts(self):
        self.authenticate(self.admin_user)
        response = self.client.get("/api/v1/discount/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

    def test_apply_discount_to_order(self):
        self.authenticate(self.admin_user)
        data = {
            "order": self.order.id,
            "coupon": ''
        }
        response = self.client.post("/api/v1/discount/apply-discount/", data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("applied_discounts", response.data)
        self.assertIn("total_discount", response.data)

    def test_get_discount_rules(self):
        self.authenticate(self.admin_user)
        response = self.client.get(f"/api/v1/discount-rule/{self.discount_rule.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_customer_access_restricted(self):
        # Log in as a customer
        self.authenticate(self.customer_user)

        # Attempt to access discount rules
        response = self.client.get(f"/api/v1/discount-rule/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()["detail"], "You do not have permission to perform this action.")

    def test_invalid_order_in_apply_discount(self):
        self.authenticate(self.admin_user)
        data = {
            "order": "9ae41349-8f15-4ca9-a635-cdc482ca5b34",  # Non-existent order ID
            "coupon": ''
        }
        response = self.client.post("/api/v1/discount/apply-discount/", data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["detail"], "Order not found")

    def test_missing_order_in_apply_discount(self):
        self.authenticate(self.admin_user)
        data = {
            "coupon": ''
        }
        response = self.client.post("/api/v1/discount/apply-discount/", data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Order ID is required")
