from rest_framework import serializers
from .models import Discount, DiscountRule, DiscountApplication, Coupon
from restaurant.branch.models import Branch
from restaurant.tenant.models import Tenant
from customer.order.serializers import OrderSerializer
from customer.order.models import Order

class CouponCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon  
        fields = '__all__'

from django.shortcuts import get_object_or_404

class DiscountSerializer(serializers.ModelSerializer):
    branches = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Branch.objects.all(), required=False
    )
    coupon = serializers.PrimaryKeyRelatedField(
        queryset=Coupon.objects.all(), required=False, allow_null=True
    )
    order = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Discount
        fields = [
            'id', 'tenant', 'name', 'description', 'type',
            'off_peak_hours', 'priority', 'is_stackable',
            'coupon', 'valid_from', 'valid_until','order',
            'is_global', 'branches', 'created_at', 'updated_at'
        ]

    def get_coupon(self, obj):
        """Returns the coupon ID instead of the full object."""
        return obj.coupon.id if obj.coupon else None

    def get_branches(self, obj):
        """Return all related branches."""
        return [
            {'id': b.id, 'address': getattr(b, 'address', None)}
            for b in obj.branches.all()
        ]

    def get_tenant(self, obj):
        """Returns tenant details to avoid unnecessary queries."""
        return {'id': obj.tenant.id, 'restaurant_name': obj.tenant.restaurant_name} if obj.tenant else None

    def create(self, validated_data):
        branches = validated_data.pop('branches', [])
        user = self.context['request'].user
        tenant = get_object_or_404(Tenant, admin=user)

        validated_data['tenant'] = tenant

        discount = Discount.objects.create(**validated_data)

        # Attach branches
        if validated_data.get('is_global'):
            tenant_branches = Branch.objects.filter(tenant=tenant)
            discount.branches.set(tenant_branches)
        elif branches:
            discount.branches.set(branches)

        return discount



    def update(self, instance, validated_data):
        """Optimized update to fetch coupon efficiently."""
        branches = validated_data.pop('branches', None)
        coupon = validated_data.pop('coupon', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if coupon:
            instance.coupon = coupon

        instance.save()

        if branches is not None:
            instance.branches.set(branches)

        return instance

    def to_representation(self, instance):
        """Optimized serialization by including related data."""
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        representation['coupon'] = self.get_coupon(instance)
        representation['branches'] = self.get_branches(instance)
        return representation



class DiscountRuleSerializer(serializers.ModelSerializer):
    discount_id = serializers.PrimaryKeyRelatedField(queryset=Discount.objects.all(),write_only=True)
    class Meta:
        model = DiscountRule
        fields = ['id','discount_id','tenant','min_items','combo_size','min_price','applicable_items','free_items','buy_quantity','get_quantity','is_percentage','max_discount_amount','created_at','updated_at']
        read_only_fields = ['id','tenant']
    def get_tenant(self,obj):
        return {
            "id":obj.tenant.id,
            "restaurant_name":obj.tenant.restaurant_name
        }
    
    def get_discount_id(self,obj):
        return {
            "id":obj.discount_id.id,
            "name":obj.discount_id.name,
            "description":obj.discount_id.description,
            "type":obj.discount_id.type,
            "off_peak_hours":obj.discount_id.off_peak_hours,
            "priority":obj.discount_id.priority,
            "is_stackable":obj.discount_id.is_stackable,
            "valid_from":obj.discount_id.valid_from,
            "valid_until":obj.discount_id.valid_until
        }
    def create(self, validated_data):
        user = self.context['request'].user
        if user.user_type == 'restaurant' or user.user_type == 'admin':
            tenant = Tenant.objects.get(admin=user)
        else:
            tenant = user.branch.tenant
        discountRule = DiscountRule.objects.create(
            tenant = tenant,
            **validated_data
        )
        return discountRule
    
    def to_representation(self, instance):
        """
        Customizes the serialized response.
        """
        representation = super().to_representation(instance)
        # Replace write-only fields with full detail serializers
        representation['discount_id'] = DiscountSerializer(instance.discount_id).data
        representation['tenant'] = self.get_tenant(instance)
        return representation

class DiscountApplicationSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    discount = serializers.PrimaryKeyRelatedField(queryset=Discount.objects.all())
    class Meta:
        model = DiscountApplication
        fields = '__all__'

    def to_representation(self, instance):
        """
        Customizes the serialized response.
        """
        representation = super().to_representation(instance)
        # Replace write-only fields with full detail serializers
        representation['order'] = OrderSerializer(instance.order).data
        representation['discount'] = DiscountSerializer(instance.discount).data
        return representation

class CouponSerializer(serializers.ModelSerializer):
    branches = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Branch.objects.all(), required=False
    )
    class Meta:
        model = Coupon
        fields = [
            'id', 'tenant', 'discount_code', 'is_percentage', 'is_valid',
            'discount_amount', 'valid_from', 'valid_until',
            'is_global', 'branches', 'created_at', 'updated_at'
        ]
