from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_api_key.models import APIKey
from .models import Feedback, User, Order
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table

class FeedbackAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='testuser@test.com', password='testpass',user_type='customer')
        self.tenant = Tenant.objects.create(restaurant_name='Test Tenant',admin=self.user)
        self.branch = Branch.objects.create(address='Test Branch',tenant=self.tenant)
        self.table = Table.objects.create(branch=self.branch)
        self.admin = User.objects.create_superuser(email='admin@test.com', password='adminpass')
        self.order = Order.objects.create(status='placed', customer=self.user,tenant=self.tenant,branch=self.branch,table=self.table)
        self.feedback = Feedback.objects.create(
            customer=self.user,
            order=self.order,
            service_rating='Good',
            food_rating='Excellent',
            wait_rating='Average',
            overall_rating=4.5,
        )
        
    
    def authenticate_user(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix, _, _ = key.partition(".")
        self.key = self.prefix + '.' + key
        self.client.credentials(HTTP_X_API_KEY=self.key,HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_feedbacks(self):
        self.authenticate_user(self.user)
        url = reverse('feedback-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 1)

    def test_retrieve_feedback(self):
        self.authenticate_user(self.user)
        url = reverse('feedback-detail', kwargs={'pk': self.feedback.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.feedback.id))

    def test_create_feedback(self):
        self.authenticate_user(self.user)
        url = reverse('feedback-list')
        data = {
            'order': self.order.id,
            'service_rating': 'Great',
            'food_rating': 'Good',
            'wait_rating': 'Poor',
            'overall_rating': 4.0,
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['service_rating'], 'Great')
    
    def test_update_feedback(self):
        self.authenticate_user(self.user)
        url = reverse('feedback-detail', kwargs={'pk': self.feedback.id})
        data = {
            'order': str(self.feedback.order.id),  # Include the order ID
            'service_rating': 'Excellent',
            'food_rating': 'Good',
            'wait_rating': 'Excellent',
            'overall_rating': 5.0,
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.feedback.refresh_from_db()
        self.assertEqual(self.feedback.service_rating, 'Excellent')


    def test_unauthorized_access(self):
        url = reverse('feedback-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)






