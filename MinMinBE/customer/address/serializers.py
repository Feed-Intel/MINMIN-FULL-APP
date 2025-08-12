from rest_framework import serializers
from .models import Address

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'address_line', 'user','gps_coordinates', 'label', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def validate(self, data):
        user = self.context['request'].user
        label = data.get('label')
        if data.get('is_default') and Address.objects.filter(user=user, is_default=True).exists():
            raise serializers.ValidationError("Only one address can be marked as default.")
        if Address.objects.filter(user=user, label=label).exists():
            raise serializers.ValidationError(
                f"An address with label '{label}' already exists for this user."
            )
        return data
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'full_name': obj.user.full_name
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['user'] = self.get_user(instance)
        return representation