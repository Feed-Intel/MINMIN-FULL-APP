from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_api_key.models import APIKey
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
from restaurant.tenant.models import Tenant
from restaurant.menu.models import Menu
from restaurant.branch.models import Branch
from accounts.models import User
from restaurant.related_menu.models import RelatedMenuItem

class RelatedMenuItemViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email="admin@test.com", password="password", user_type="restaurant"
        )
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant",admin=self.admin_user)
        self.branch = Branch.objects.create(tenant=self.tenant, address="123 Main St")
        self.menu_item = Menu.objects.create(
            name="Menu Item 1",
            price=10.00,
            tenant=self.tenant
        )
        self.menu_item2 = Menu.objects.create(
            name="Menu Item 12",
            price=10.00,
            tenant=self.tenant
        )
        self.related_item = Menu.objects.create(
            name="Menu Item 2",
            price=15.00,
            tenant=self.tenant
        )
        self.related_menu_item = RelatedMenuItem.objects.create(
            tenant=self.tenant,
            menu_item=self.menu_item,
            related_item=self.related_item,
            tag="Best Paired With"
        )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix,_,__ = key.partition(".")
        self.key = self.prefix+'.'+key  # Full key (prefix.key)
        self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_related_menu_items(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('relatedmenuitem-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_related_menu_item(self):
        self.authenticate(self.admin_user)
        data = {
            "tenant": self.tenant.id,
            "menu_item": self.menu_item2.id,
            "related_item": self.related_item.id,
            "tag": "Customer Favorite"
        }
        response = self.client.post(reverse('relatedmenuitem-list'), data)
        print(response.json())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["tag"], "Customer Favorite")

    def test_create_related_menu_item_invalid_tag(self):
        self.authenticate(self.admin_user)
        data = {
            "tenant": self.tenant.id,
            "menu_item": self.menu_item2.id,
            "related_item": self.related_item.id,
            "tag": "Invalid Tag"
        }
        response = self.client.post(reverse('relatedmenuitem-list'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_related_menu_item(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('relatedmenuitem-detail', args=[self.related_menu_item.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.related_menu_item.id))

    def test_update_related_menu_item(self):
        self.authenticate(self.admin_user)
        data = {"tag": "Alternative"}
        response = self.client.patch(reverse('relatedmenuitem-detail', args=[self.related_menu_item.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["tag"], "Alternative")

    def test_delete_related_menu_item(self):
        self.authenticate(self.admin_user)
        response = self.client.delete(reverse('relatedmenuitem-detail', args=[self.related_menu_item.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_related_menu_items_by_tag(self):
        self.authenticate(self.admin_user)
        response = self.client.get(reverse('relatedmenuitem-list') + "?tag=Best Paired With")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()['results']), 1)

