from django.core.cache import cache
from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from customer.feedback.models import Feedback
from rest_framework.exceptions import PermissionDenied
from customer.feedback.serializers import FeedbackSerializer
from accounts.permissions import HasCustomAPIKey
from accounts.utils import get_user_tenant

class FeedbackPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class FeedbackViewSet(ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order', 'customer', 'overall_rating']
    permission_classes = [IsAuthenticated, HasCustomAPIKey]
    pagination_class = FeedbackPagination

    # Caching the feedback list
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            queryset = Feedback.objects.all().select_related('order', 'customer')
        elif user.user_type == 'restaurant':
            queryset = Feedback.objects.filter(restaurant=get_user_tenant(user)).select_related('order', 'customer')
        else:
            queryset = Feedback.objects.filter(customer=user).select_related('order', 'customer')
        return queryset

    # Caching individual feedback
    def retrieve(self, request, *args, **kwargs):
        if request.user.user_type != 'admin' and self.get_object().customer != request.user:
            raise PermissionDenied("You do not have permission to view this object.")
        return super().retrieve(request, *args, **kwargs)

    # Invalidate the cache when creating feedback
    def perform_create(self, serializer):
        feedback = serializer.save(customer=self.request.user)
        cache.delete(f'feedback_list_{self.request.user.id}')
        cache.delete(f'feedback_list_admin')  # For admins

    # Invalidate the cache when updating feedback
    def perform_update(self, serializer):
        feedback = serializer.save()
        cache.delete(f'feedback_{feedback.id}')
        cache.delete(f'feedback_list_{self.request.user.id}')
        cache.delete(f'feedback_list_admin')  # For admins
