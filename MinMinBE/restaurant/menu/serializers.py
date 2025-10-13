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
    is_global = serializers.BooleanField(write_only=True, required=False) 
    branches = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all()),
        allow_empty=True,
        allow_null=True,
        help_text="List of related items with id",
        write_only=True,
    )
    class Meta:
        model = Menu
        fields = ['id','name', 'image', 'tenant', 'description', 'tags', 'categories', 'category', 'price', 'is_side','average_rating','is_global','branches']
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
        branches = validated_data.pop('branches')
        is_global = validated_data.pop('is_global')
        menu = Menu.objects.create(
            tenant=tenant,
            **validated_data
        )
        if is_global:
            for branch in Branch.objects.filter(tenant=tenant):
                MenuAvailability.objects.create(
                    branch=branch,
                    menu_item=menu,
                )
        else:
            for branch in branches:
                MenuAvailability.objects.create(
                    branch=branch,
                    menu_item=menu,
                )
        return menu
    
    def update(self, instance, validated_data):
        user = self.context['request'].user
        tenant = Tenant.objects.get(admin=user)
        branches = validated_data.pop('branches')
        is_global = validated_data.pop('is_global')
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.price = validated_data.get('price', instance.price)
        instance.is_side = validated_data.get('is_side', instance.is_side)
        instance.categories = validated_data.get('categories', instance.categories)
        instance.image = validated_data.get('image', instance.image)
        # instance.is_global = validated_data.get('is_global', instance.is_global)
        instance.save()
        MenuAvailability.objects.filter(menu_item=instance).delete()
        if is_global:
            for branch in Branch.objects.filter(tenant=tenant):
                MenuAvailability.objects.create(
                    branch=branch,
                    menu_item=instance,
                )
        else:
            for branch in branches:
                MenuAvailability.objects.create(
                    branch=branch,
                    menu_item=instance,
                )
        return instance
    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name,
            'CHAPA_API_KEY': obj.tenant.CHAPA_API_KEY,
            'CHAPA_PUBLIC_KEY':obj.tenant.CHAPA_PUBLIC_KEY,
            'tax': obj.tenant.tax,
            'service_charge': obj.tenant.service_charge
        }
    def get_is_global(self, obj):
        user = self.context['request'].user
        if user.user_type in ['admin', 'restaurant']:
            tenant = Tenant.objects.get(admin=user)
            return Branch.objects.filter(tenant=tenant).count() == MenuAvailability.objects.filter(menu_item=obj).count()
        return False
    def get_branches(self, obj):
        return MenuAvailability.objects.filter(menu_item=obj).values_list('branch_id', flat=True)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        representation['branches'] = self.get_branches(instance)
        representation['is_global'] = self.get_is_global(instance)
        return representation

    


        
