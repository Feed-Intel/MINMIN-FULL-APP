import json
from rest_framework import serializers
from .models import Menu
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.menu_availability.models import MenuAvailability

class MenuSerializer(serializers.ModelSerializer):
    image = serializers.ImageField()
    average_rating = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    class Meta:
        model = Menu
        fields = ['id','name', 'image', 'tenant', 'description', 'tags', 'categories', 'category', 'price', 'is_side','average_rating']
        read_only_fields = ['tenant','average_rating','category']

    def get_average_rating(self, obj):
        return obj.average_rating if obj.average_rating else None

    def get_category(self, obj):
        return obj.category

    def validate_categories(self, value):
        if value in (None, ""):
            return []

        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError:
                parsed = [item.strip() for item in value.split(',') if item.strip()]
            else:
                if not isinstance(parsed, list):
                    raise serializers.ValidationError("Categories must be a list of strings.")
            value = parsed

        if isinstance(value, tuple):
            value = list(value)

        if not isinstance(value, list):
            raise serializers.ValidationError("Categories must be provided as a list of strings.")

        cleaned_categories = []
        for item in value:
            if not isinstance(item, str):
                item = str(item)
            item = item.strip()
            if item:
                cleaned_categories.append(item)

        return cleaned_categories
    
    def create(self, validated_data):
        user = self.context['request'].user
        tenant = Tenant.objects.get(admin=user)
        menu = Menu.objects.create(
            tenant=tenant,
            **validated_data
        )
        for branch in Branch.objects.filter(tenant=tenant):
            MenuAvailability.objects.create(
                branch=branch,
                menu_item=menu,
            )
        return menu
    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name,
            'CHAPA_API_KEY': obj.tenant.CHAPA_API_KEY,
            'CHAPA_PUBLIC_KEY':obj.tenant.CHAPA_PUBLIC_KEY,
            'tax': obj.tenant.tax,
            'service_charge': obj.tenant.service_charge
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        return representation

    


        
