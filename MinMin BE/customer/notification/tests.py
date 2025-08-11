from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_api_key.models import APIKey
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from accounts.models import User
from customer.notification.models import Notification

class NotificationViewSetTest(TestCase):

    def setUp(self):
        # Creating test users and notifications
        self.user = User.objects.create_user(email='admin@test.com', password='password', user_type='customer')
        self.other_user = User.objects.create_user(email='otheruser@gmail.com', password='password', user_type='customer')
        self.notification1 = Notification.objects.create(
            customer=self.user,
            message="Your order has been shipped.",
            notification_type="Order Update"
        )
        self.notification2 = Notification.objects.create(
            customer=self.user,
            message="Exclusive promotion for you!",
            notification_type="Promotion"
        )
        self.notification3 = Notification.objects.create(
            customer=self.other_user,
            message="Notification for other user",
            notification_type="Order Update"
        )
        self.client = APIClient()
    
    def authenticate_user(self, user):
        refresh = RefreshToken.for_user(user)
        _, key = APIKey.objects.create_key(name="Test API Key")
        self.prefix, _, _ = key.partition(".")
        self.key = self.prefix + '.' + key
        self.client.credentials(HTTP_X_API_KEY=self.key,HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_mark_notification_as_read(self):
        # Verify notification is initially unread
        self.authenticate_user(self.user)
        notification = Notification.objects.get(id=self.notification1.id)
        self.assertFalse(notification.is_read)

        # Mark notification as read
        response = self.client.post(f'/api/v1/notification/{self.notification1.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['success'], 'Notification marked as read.')

        # Verify notification is marked as read
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_mark_notification_as_read_for_other_user(self):
        self.authenticate_user(self.user)  # Ensure the right user is authenticated

        # Attempt to mark notification that belongs to another user
        response = self.client.post(f'/api/v1/notification/{self.notification3.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Notification not found.')

    def test_get_notifications_for_authenticated_user(self):
        self.authenticate_user(self.user)

        # Get notifications for the authenticated user
        response = self.client.get('/api/v1/notification/')
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data['results']), 2)

        # Check if notifications returned belong to the authenticated user
        notification_ids = [notification['id'] for notification in data['results']]
        self.assertIn(str(self.notification1.id), notification_ids)
        self.assertIn(str(self.notification2.id), notification_ids)

    def test_get_notifications_for_unauthenticated_user(self):
        # Try to access notifications without authentication
        self.client.credentials()  # Remove credentials
        response = self.client.get('/api/v1/notification/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

