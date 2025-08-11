from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework_api_key.models import APIKey
from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant
from django.core.files.uploadedfile import SimpleUploadedFile
import json
import os
from django.conf import settings

class MenuViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="password", user_type="restaurant"
        )
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant",admin=self.admin_user)
        image_path = os.path.join(settings.BASE_DIR, 'media/qr_codes/qr_code.png')
        with open(image_path, 'rb') as img_file:
            self.test_image = SimpleUploadedFile(
                name='test_image.jpg',
                content=img_file.read(),
                content_type='image/jpeg'
            )
        self.menu = Menu.objects.create(
            name="Test Menu",
            tenant=self.tenant,
            description="Test description",
            image=self.test_image,
            tags=json.dumps(["tag1", "tag2"]),
            category="Main Course",
            price=10.99,
            is_side=False
        )
    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_menus(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('menu-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_menu(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('menu-detail', args=[self.menu.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Test Menu")

    def test_create_menu(self):
        self.authenticate(self.admin_user)
        image_path = os.path.join(settings.BASE_DIR, 'media/qr_codes/qr_code.png')
        with open(image_path, 'rb') as img_file:
            test_image = SimpleUploadedFile(
                name='test_image.jpg',
                content=img_file.read(),
                content_type='image/jpeg'
            )
        data = {
            "name": "New Menu",
            "tenant": self.tenant.id,
            "image": test_image,
            "description": "New description",
            "tags": json.dumps(["tag3", "tag4"]),
            "category": "Dessert",
            "price": 5.99,
            "is_side": True
        }
        response = self.client.post(reverse('menu-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "New Menu")

    def test_update_menu(self):
        self.authenticate(self.admin_user)
        data = {
            "name": "Updated Menu",
            "description": "Updated description",
            "price": 12.99
        }
        response = self.client.patch(reverse('menu-detail', args=[self.menu.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.menu.refresh_from_db()
        self.assertEqual(self.menu.name, "Updated Menu")
        self.assertEqual(self.menu.description, "Updated description")
        self.assertEqual(float(self.menu.price), 12.99)

    def test_delete_menu(self):
        self.authenticate(self.admin_user)
        response = self.client.delete(reverse('menu-detail', args=[self.menu.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Menu.objects.filter(id=self.menu.id).exists())
