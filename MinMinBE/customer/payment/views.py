from django.core.cache import cache
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Payment
from .serializers import PaymentSerializer
from .paymentFilter import PaymentFilter
from accounts.permissions import HasCustomAPIKey, IsAdminOrCustomer
from rest_framework.decorators import action
from rest_framework.response import Response
from .integration import PaymentService
from rest_framework.pagination import PageNumberPagination
from .utils import verify_payment

class PaymentPagination(PageNumberPagination):
    page_size = 10

class PaymentView(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasCustomAPIKey, IsAdminOrCustomer]
    filter_backends = [DjangoFilterBackend]
    filterset_class = PaymentFilter
    serializer_class = PaymentSerializer
    pagination_class = PaymentPagination
    def get_queryset(self):
        user = self.request.user

        if user.user_type == 'admin':
            payments = Payment.objects.select_related('order').all()
        else:
            payments = Payment.objects.select_related('order').filter(order__customer=user)

        return payments
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()  

        return Response(
            {
                **PaymentSerializer(payment).data
            },
            status=status.HTTP_201_CREATED
        )
    
    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()
        payment.payment_status = 'cancelled'
        payment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='process')
    def process_payment(self, request):
        data = request.data
        amount = data.get('amount')
        payment_method = data.get('payment_method')
        transaction_id = data.get('transaction_id')

        if not amount or not payment_method:
            return Response(
                {"error": "Amount and payment_method are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Call the external payment service
        payment_response = PaymentService.process_payment(amount, payment_method, transaction_id)
        
        if 'error' in payment_response:
            return Response({"error": payment_response['error']}, status=status.HTTP_400_BAD_REQUEST)

        # Invalidate cache for the current user after processing a payment
        cache_key = f"payments_{request.user.id}"
        cache.delete(cache_key)

        return Response(payment_response, status=status.HTTP_200_OK)
    

class PaymentCheckView(viewsets.ModelViewSet):
    queryset = Payment.objects.none()
    authentication_classes = []
    permission_classes = []
    serializer_class = PaymentSerializer
    """
    View to check if a payment is valid
    """
    @action(detail=True, methods=['get'], url_path='verify')
    def verify_payment(self, request, pk=None):
        try:
            print("Payment ID:", pk)
            payment = Payment.objects.filter(transaction_id=pk).first()
            resp = verify_payment(pk,payment.order.tenant.CHAPA_API_KEY)
            if resp['status'] == 'success':
                payment.payment_status = 'completed'
                payment.save()
            return Response(resp, status=status.HTTP_200_OK)
        except Payment.DoesNotExist:
            return Response({'error': 'Invalid payment ID'}, status=status.HTTP_400_BAD_REQUEST)
