from rest_framework import serializers
from customer.feedback.models import Feedback
from accounts.serializers import UserSerializer
from customer.order.models import Order
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant

class FeedbackSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    menu = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.all())
    class Meta:
        model = Feedback
        fields = ['id', 'customer', 'order', 'menu', 'restaurant', 'service_rating', 'food_rating', 'wait_rating', 'overall_rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['customer', 'created_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['order'] = self.get_order(instance)
        representation['customer'] = self.get_customer(instance)
        representation['menu'] = self.get_menu(instance)
        representation['restaurant'] = self.get_restaurant(instance)
        return representation

    def get_order(self, obj):
        return {
            'id': obj.order.id,
            'table': obj.order.table.id,
            'branch': obj.order.branch.id,
            'status': obj.order.status,
            'total_price': obj.order.calculate_total()
        }
    
    def get_menu(self, obj):
        return {
            'id': obj.menu.id,
            'name': obj.menu.name,
            'price': obj.menu.price
        }
    
    def get_restaurant(self, obj):
        return {
            'id': obj.restaurant.id,
            'name': obj.restaurant.restaurant_name
        }
    
    def get_customer(self, obj):
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.full_name,
            'image': self.get_image_url(obj.customer)
        }
    
    def get_image_url(self, customer):
        request = self.context.get('request')  
        if customer.image:
            return request.build_absolute_uri(customer.image.url) if request else customer.image.url
        return None
    

