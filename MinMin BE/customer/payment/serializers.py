from rest_framework import serializers
from customer.order.models import Order
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    class Meta:
        model = Payment
        fields = '__all__'
        # read_only_fields = ['id', 'created_at', 'updated_at']

    def get_order(self, obj):
        return {
            'id': obj.order.id,
            'status': obj.order.status,
            'total_price': obj.order.calculate_total(),
        }
    
    def to_representation(self, instance):
        """
        Customizes the serialized response.
        """
        representation = super().to_representation(instance)
        # Replace write-only fields with full detail serializers
        representation['order'] = self.get_order(instance)
        return representation
