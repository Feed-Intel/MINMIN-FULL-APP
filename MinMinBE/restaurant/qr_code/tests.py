from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_api_key.models import APIKey
from django.urls import reverse
from accounts.models import User
from restaurant.qr_code.models import QRCode, Tenant, Branch, Table
from alpha import settings
import os

class QRCodeViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="password", user_type="restaurant"
        )
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant",admin=self.admin_user)
        self.branch = Branch.objects.create(tenant=self.tenant, address="123 Main St")
        self.table = Table.objects.create(branch=self.branch)
        self.qr_code = QRCode.objects.create(
            tenant=self.tenant,
            branch=self.branch,
            table=self.table,
            qr_code_url="http://example.com/qr-code"
        )
    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_qr_codes(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('qrcode-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_qr_code_with_table(self):
        self.authenticate(self.admin_user)
        data = {
            "tenant": self.tenant.id,
            "branch": self.branch.id,
            "table": self.table.id
        }
        response = self.client.post(reverse('qrcode-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("qr_code_url", response.data)

    def test_create_qr_code_without_table(self):
        self.authenticate(self.admin_user)
        data = {
        }
        response = self.client.post(reverse('qrcode-list'), data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_retrieve_qr_code(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('qrcode-detail', args=[self.qr_code.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.qr_code.id))

    def test_delete_qr_code(self):
        self.authenticate(self.admin_user)
        response = self.client.delete(reverse('qrcode-detail', args=[self.qr_code.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_qr_code_url_generation(self):
        self.authenticate(self.admin_user)
        data = {
            "table": self.table.id
        }
        response = self.client.post(reverse('qrcode-list'), data)
        file_name = f"{self.table.id or 'default'}.png"
        expected_url = os.path.join(settings.MEDIA_URL, f"qr_codes/{self.tenant.restaurant_name.replace(' ', '_')}/{self.branch.address.replace(' ', '_')}/{file_name}")
        self.assertIn(expected_url, response.data["qr_code_url"])
