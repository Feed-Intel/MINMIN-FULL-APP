import requests
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

class PaymentService:
    @staticmethod
    @method_decorator(cache_page(60 * 5), name='process_payment')
    def process_payment(amount, payment_method, transaction_id=None):
        # Place for integrating with a payment gateway
        payload = {
            'amount': amount,
            'method': payment_method,
            'transaction_id': transaction_id,
        }
        headers = {'Authorization': 'Bearer <API_KEY>'}
        try:
            response = requests.post('https://payment-gateway.example.com/pay', json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {'error': str(e)}
