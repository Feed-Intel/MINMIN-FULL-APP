from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User
from rest_framework_api_key.models import APIKey
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Payment
from customer.order.models import Order
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table
from unittest.mock import patch
import uuid

class PaymentViewTests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        # Create test users
        cls.admin_user = User.objects.create_user(
            email="admin@test.com", password="password", user_type="admin"
        )
        cls.customer_user = User.objects.create_user(
            email="customer@test.com", password="password", user_type="customer"
        )
        cls.tenant = Tenant.objects.create(restaurant_name="Test Tenant", admin=cls.admin_user)
        cls.branch = Branch.objects.create(tenant=cls.tenant, address="123 Main St")
        cls.table = Table.objects.create(branch=cls.branch)

        # Create a test order
        cls.order = Order.objects.create(
            tenant=cls.tenant,
            branch=cls.branch,
            table=cls.table,
            customer=cls.customer_user,
            status='placed',
        )

        cls.order.items.set([])

        # Create a test payment
        cls.payment = Payment.objects.create(
            order=cls.order,
            payment_method="card",
            payment_status="completed",
            transaction_id="12345",
            amount_paid=100.00
        )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_payments_as_admin(self):
        self.authenticate(self.admin_user)
        response = self.client.get("/api/v1/payment/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 1)

    def test_list_payments_as_customer(self):
        self.authenticate(self.customer_user)
        response = self.client.get("/api/v1/payment/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(str(data['results'][0]["order"]['id']), str(self.order.id))

    def test_create_payment(self):
        self.authenticate(self.admin_user)
        payload = {
            "order": str(self.order.id),
            "payment_method": "cash",
            "payment_status": "pending",
            "transaction_id": "12345",
            "amount_paid": 50.00
        }
        response = self.client.post("/api/v1/payment/", data=payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Payment.objects.count(), 2)

    @patch("customer.payment.integration.PaymentService.process_payment")
    def test_process_payment_success(self, mock_payment_service):
        self.authenticate(self.customer_user)
        mock_payment_service.return_value = {"status": "success", "transaction_id": "12345"}

        payload = {
            "amount": 100.00,
            "payment_method": "card",
            "transaction_id": "12345"
        }
        response = self.client.post("/api/v1/payment/process/", data=payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        self.assertEqual(response.data["status"], "success")

    @patch("customer.payment.integration.PaymentService.process_payment")
    def test_process_payment_failure(self, mock_payment_service):
        self.authenticate(self.customer_user)
        mock_payment_service.return_value = {"error": "Insufficient funds"}

        payload = {
            "amount": 100.00,
            "payment_method": "card"
        }
        response = self.client.post("/api/v1/payment/process/", data=payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "Insufficient funds")

    def test_filter_payments(self):
        self.authenticate(self.admin_user)
        response = self.client.get(f"/api/v1/payment/?payment_status=completed")
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data['results']), 1)

    def test_invalid_create_payment(self):
        self.authenticate(self.admin_user)
        payload = {
            "order": str(uuid.uuid4()),  # Non-existent order
            "payment_method": "cash",
            "payment_status": "pending",
            "transaction_id": "12345",
            "amount_paid": 50.00
        }
        response = self.client.post("/api/v1/payment/", data=payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_permission_denied_for_unauthenticated_user(self):
        response = self.client.get("/api/v1/payment/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
