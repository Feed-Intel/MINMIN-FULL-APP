from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .serializers import NotificationSerializer
from .models import Notification
from accounts.permissions import IsAdminOrCustomer

class NotificationPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class NotificationViewSet(ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrCustomer]
    pagination_class = NotificationPagination

    def get_queryset(self):
        user = self.request.user# Try fetching cached data

        if user.user_type == 'admin':
            notifications = Notification.objects.all()
        else:
            notifications = user.notifications.all()
        return notifications

    def list(self, request, *args, **kwargs):
        # Get the base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Calculate unread count
        unread_count = queryset.filter(is_read=False).count()
        
        # Proceed with original list processing
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            # Add unread count to paginated response
            response.data['unread_count'] = unread_count
            return response
        
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        data['unread_count'] = unread_count
        return Response(data)

    @action(detail=True, methods=['post'], url_path='read')
    def mark_as_read(self, request, pk=None):
        """
        Custom action to mark a notification as read.
        """
        notification = Notification.objects.filter(id=pk, customer=request.user).first()
        if request.user.user_type == 'admin':
            notification = Notification.objects.filter(id=pk).first()
        if notification is None:
            return Response({"error": "Notification not found."}, status=404)

        notification.is_read = True
        notification.save()

        return Response({"success": "Notification marked as read."})
