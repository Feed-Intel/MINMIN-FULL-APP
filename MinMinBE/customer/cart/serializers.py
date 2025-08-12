from rest_framework import serializers
from .models import Cart, CartItem
from restaurant.menu.models import Menu

class CartItemSerializer(serializers.ModelSerializer):
    cart = serializers.PrimaryKeyRelatedField(queryset=Cart.objects.all())
    menu_item = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())
    class Meta:
        model = CartItem
        fields = ['id', 'cart', 'menu_item', 'quantity']
    
    def get_menu_item(self, obj):
        return {
            'id': obj.menu_item.id,
            'name': obj.menu_item.name,
            'price': obj.menu_item.price,
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['menu_item'] = self.get_menu_item(instance)
        return representation

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    class Meta:
        model = Cart
        fields = ['id', 'customer', 'tenant', 'created_at', 'items']
        read_only_fields = ['customer']

    def create(self, validated_data):
        customer = self.context['request'].user
        cart = Cart.objects.create(
            customer=customer,
            **validated_data
            )
        return cart

    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name,
        }
    
    def get_customer(self, obj):
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.full_name
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        representation['customer'] = self.get_customer(instance)        
        return representation
