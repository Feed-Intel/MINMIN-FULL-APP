from rest_framework.test import APIClient,APITestCase
from rest_framework import status
from rest_framework_api_key.models import APIKey
from accounts.models import User
from .models import Order, Tenant, Branch, Table, OrderItem, Menu
from rest_framework_simplejwt.tokens import RefreshToken

class OrderViewSetTest(APITestCase):

    def setUp(self):
        # Creating test data
        self.admin_user = User.objects.create_user(email='admin@test.com', password='adminpassword', user_type='admin')
        self.customer_user = User.objects.create_user(email='customer@test.com', password='customerpassword', user_type='customer')
        self.tenant = Tenant.objects.create(restaurant_name="Test Tenant",admin=self.admin_user)
        self.branch = Branch.objects.create(tenant=self.tenant, address="123 Main St")
        self.table = Table.objects.create(branch=self.branch)
        self.menuItem = Menu.objects.create(
            name="Test Menu Item",
            image='images/test_image.jpg',  # Assuming you want to set the image path
            tenant=self.tenant,
            description='Delicious breakfast',
            tags=['Breakfast'],
            categories=['Fast Food'],
            price=10.00
        )
        self.order = Order.objects.create(
            tenant=self.tenant,
            branch=self.branch,
            table=self.table,
            customer=self.customer_user,
            status='placed',
        )

        self.order2 = Order.objects.create(
            tenant=self.tenant,
            branch=self.branch,
            table=self.table,
            customer=self.customer_user,
            status='progress'
        )
        self.client = APIClient()

    def authenticate_user(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix, _, _ = key.partition(".")
        self.key = self.prefix + '.' + key
        self.client.credentials(HTTP_X_API_KEY=self.key,HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_create_order_as_customer(self):
        
        self.authenticate_user(self.customer_user)
        # Create a new order for the customer
        data = {
            'tenant': str(self.tenant.id),
            'branch': str(self.branch.id),
            'table': str(self.table.id),
            'customer': str(self.customer_user.id),
            'status': 'placed',
            'items': [
                {
                    'menu_item': str(self.menuItem.id),
                    'quantity': 1,
                    'price': 10.00
                }
            ]
        }
        response = self.client.post('/api/v1/order/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify that the order is created successfully
        self.assertEqual(response.data['total_price'], 10.00)
        self.assertEqual(response.data['status'], 'placed')

    def test_create_order_as_non_authenticated_user(self):
        # Attempt to create an order without authentication
        data = {
            'tenant': str(self.tenant.id),
            'branch': str(self.branch.id),
            'table': str(self.table.id),
            'customer': str(self.customer_user.id),
            'status': 'placed',
            'items': [
                {
                    'menu_item': str(self.menuItem.id),
                    'quantity': 1,
                    'price': 10.00
                }
            ]
        }

        response = self.client.post('/api/v1/order/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_orders_as_customer(self):
        # Authenticate as customer
        self.authenticate_user(self.customer_user)

        # Get orders of the customer
        response = self.client.get('/api/v1/order/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify that only customer-specific orders are returned
        data = response.json()
        order_ids = [order['id'] for order in data['results']]
        self.assertIn(str(self.order.id), order_ids)
        self.assertIn(str(self.order2.id), order_ids)

    def test_get_orders_as_admin(self):
        # Authenticate as admin
        self.authenticate_user(self.admin_user)

        # Get orders of all customers as admin
        response = self.client.get('/api/v1/order/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify that all orders are returned
        data = response.json()
        order_ids = [order['id'] for order in data['results']]
        self.assertIn(str(self.order.id), order_ids)
        self.assertIn(str(self.order2.id), order_ids)

    def test_update_order_status_as_admin(self):
        # Authenticate as admin
        self.authenticate_user(self.admin_user)

        # Update the order status
        data = {
            'status': 'delivered'
        }

        response = self.client.patch(f'/api/v1/order/{self.order.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify that the status is updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'delivered')

    def test_update_order_status_as_customer(self):
        # Authenticate as customer
        self.authenticate_user(self.customer_user)

        # Attempt to update the order status as customer
        data = {
            'status': 'delivered'
        }

        response = self.client.patch(f'/api/v1/order/{self.order.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_orders_by_status(self):
        # Authenticate as customer
        self.authenticate_user(self.customer_user)

        # Filter orders by status
        response = self.client.get('/api/v1/order/', {'status': 'placed'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify that only orders with status 'placed' are returned
        data = response.json()
        order_ids = [order['id'] for order in data['results']]
        self.assertIn(str(self.order.id), order_ids)
        self.assertNotIn(str(self.order2.id), order_ids)
    
    def test_get_order_by_invalid_id(self):
        # Authenticate as customer
        self.authenticate_user(self.customer_user)

        # Attempt to get an order with an invalid ID
        response = self.client.get('/api/v1/orders/invalid-id/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
