# from django.test import TestCase
# from rest_framework.test import APIClient
# from rest_framework import status
# from rest_framework_api_key.models import APIKey
# from django.urls import reverse
# from accounts.models import User
# from .models import Cart, CartItem
# from restaurant.tenant.models import Tenant

# class CartViewSetTests(TestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.user = User.objects.create_user(email='admin@test.com', password='password',user_type='customer')
#         self.tenant = Tenant.objects.create(restaurant_name="Test Tenant")
#         self.cart = Cart.objects.create(customer=self.user,tenant = self.tenant)
#         _, key = APIKey.objects.create_key(name="Test API Key")
#         self.prefix,_,__ = key.partition(".")
#         self.key = self.prefix+'.'+key  # Full key (prefix.key)
        
#         self.client.credentials(HTTP_X_API_KEY=self.key)

#         response = self.client.post('/api/auth/login/', {'email': 'admin@test.com', 'password': 'password'}, format='json')


#         self.assertEqual(response.status_code, 200)  # Ensure token generation was successful

#         # Extract tokens from the response
#         self.access_token = response.data['access']
#         self.refresh_token = response.data['refresh']

#         self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

#     def test_list_carts(self):
#         response = self.client.get(reverse('cart-list'))
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 1)

#     def test_create_cart(self):
#         response = self.client.post(reverse('cart-list'))
#         self.assertEqual(response.status_code, status.HTTP_201_CREATED)
#         self.assertEqual(response.data["customer"], str(self.user.id))

#     def test_retrieve_cart(self):
#         response = self.client.get(reverse('cart-detail', args=[self.cart.id]))
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data["id"], str(self.cart.id))

#     def test_delete_cart(self):
#         response = self.client.delete(reverse('cart-detail', args=[self.cart.id]))
#         self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

# class CartItemViewSetTests(TestCase):
#     def setUp(self):
#         self.client = APIClient()
#         self.user = User.objects.create_user(email='admin@test.com', password='password',user_type='customer')
#         self.tenant = Tenant.objects.create(restaurant_name="Test Tenant")
#         self.cart = Cart.objects.create(customer=self.user,tenant = self.tenant)
#         self.cart_item = CartItem.objects.create(cart=self.cart, menu_item_id=1, quantity=2)
#         _, key = APIKey.objects.create_key(name="Test API Key")
#         self.prefix,_,__ = key.partition(".")
#         self.key = self.prefix+'.'+key  # Full key (prefix.key)
        
#         self.client.credentials(HTTP_X_API_KEY=self.key)

#         response = self.client.post('/api/auth/login/', {'email': 'admin@test.com', 'password': 'password'}, format='json')


#         self.assertEqual(response.status_code, 200)  # Ensure token generation was successful

#         # Extract tokens from the response
#         self.access_token = response.data['access']
#         self.refresh_token = response.data['refresh']

#         self.client.credentials(HTTP_X_API_KEY=self.key, HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

#     def test_list_cart_items(self):
#         response = self.client.get(reverse('cartitem-list'))
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 1)

#     def test_create_cart_item(self):
#         data = {"cart": self.cart.id, "menu_item_id": 2, "quantity": 3}
#         response = self.client.post(reverse('cartitem-list'), data)
#         self.assertEqual(response.status_code, status.HTTP_201_CREATED)
#         self.assertEqual(response.data["menu_item_id"], 2)

#     def test_retrieve_cart_item(self):
#         response = self.client.get(reverse('cartitem-detail', args=[self.cart_item.id]))
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data["id"], str(self.cart_item.id))

#     def test_update_cart_item(self):
#         data = {"quantity": 5}
#         response = self.client.patch(reverse('cartitem-detail', args=[self.cart_item.id]), data)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(response.data["quantity"], 5)

#     def test_delete_cart_item(self):
#         response = self.client.delete(reverse('cartitem-detail', args=[self.cart_item.id]))
#         self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
