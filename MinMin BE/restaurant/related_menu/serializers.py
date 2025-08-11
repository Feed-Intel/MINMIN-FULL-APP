from rest_framework import serializers
from .models import RelatedMenuItem
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant

class RelatedMenuItemSerializer(serializers.ModelSerializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())
    related_item = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())
    class Meta:
        model = RelatedMenuItem
        fields = ['id', 'tenant', 'menu_item', 'related_item', 'tag']
        read_only_fields = ['tenant']

    def create(self, validated_data):
        """
        Creates a new RelatedMenuItem instance.
        """
        user = self.context['request'].user
        tenant = Tenant.objects.get(admin=user)
        related_menu_item = RelatedMenuItem.objects.create(
            tenant=tenant,
            **validated_data
        )
        return related_menu_item

    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name,
            'CHAPA_API_KEY': obj.tenant.CHAPA_API_KEY,
            'CHAPA_PUBLIC_KEY':obj.tenant.CHAPA_PUBLIC_KEY,
            'tax': obj.tenant.tax,
            'service_charge': obj.tenant.service_charge
        }
    
    def get_related_item(self, obj):
        return {
            'id': obj.related_item.id,
            'name': obj.related_item.name,
            'price': obj.related_item.price,
            'image': self.get_image_url(obj.related_item),
        }

    def get_menu_item(self, obj):
        return {
            'id': obj.menu_item.id,
            'name': obj.menu_item.name,
            'price': obj.menu_item.price,
            'image': self.get_image_url(obj.menu_item),
        }
    
    def get_image_url(self, menu_item):
        request = self.context.get('request')  # Get request object if available
        if menu_item.image:
            return request.build_absolute_uri(menu_item.image.url) if request else menu_item.image.url
        return None

    def to_representation(self, instance):
        """
        Customizes the serialized response.
        """
        representation = super().to_representation(instance)
        # Replace write-only fields with full detail serializers
        representation['tenant'] = self.get_tenant(instance)
        representation['menu_item'] = self.get_menu_item(instance)
        representation['related_item'] = self.get_related_item(instance)
        return representation
