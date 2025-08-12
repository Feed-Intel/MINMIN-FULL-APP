from rest_framework import serializers
from .models import CustomerLoyalty,TenantLoyalty, LoyaltyConversionRate, LoyaltyTransaction,GlobalLoyaltySettings,RestaurantLoyaltySettings
from restaurant.tenant.models import Tenant

class GlobalLoyaltySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalLoyaltySettings
        fields = '__all__'

class RestaurantLoyaltySettingsSerializer(serializers.ModelSerializer):
    # tenant = serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.all())
    global_to_restaurant_rate = serializers.FloatField(required=False, default=0.0)
    class Meta:
        model = RestaurantLoyaltySettings
        fields = ['id','tenant','threshold','global_to_restaurant_rate']
        read_only_fields = ['tenant']
    
    def create(self, validated_data):
        user = self.context['request'].user
        tenant = Tenant.objects.get(admin=user)
        threshold = validated_data.pop('threshold')
        global_to_restaurant_rate = validated_data.pop('global_to_restaurant_rate')
        restaurant_loyality_setting, _ = RestaurantLoyaltySettings.objects.get_or_create(tenant=tenant)
        restaurant_loyality_setting.threshold = threshold
        restaurant_loyality_setting.save()
        if global_to_restaurant_rate != 0.0:
            conversion, _ = LoyaltyConversionRate.objects.get_or_create(tenant=tenant)
            conversion.global_to_restaurant_rate = global_to_restaurant_rate
            conversion.save()
        return restaurant_loyality_setting
        

class CustomerLoyaltySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerLoyalty
        fields = '__all__'
        read_only_fields = ['customer']

    def get_customer(self, obj):
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.full_name
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['customer'] = self.get_customer(instance)
        return representation

class RestaurantLoyaltySerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantLoyalty
        fields = '__all__'
        read_only_fields = ['tenant','customer']
    
    def get_customer(self, obj):
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.full_name
        }
    
    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['customer'] = self.get_customer(instance)
        representation['tenant'] = self.get_tenant(instance)
        return representation

class LoyaltyConversionRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyConversionRate
        fields = '__all__'
        read_only_fields = ['tenant']
    
    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        return representation

class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTransaction
        fields = '__all__'
        read_only_fields = ['tenant','customer']
    
    def get_customer(self, obj):
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.full_name
        }
    
    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['customer'] = self.get_customer(instance)
        representation['tenant'] = self.get_tenant(instance)
        return representation