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

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers

class DiscountSerializer(serializers.ModelSerializer):
    coupon = serializers.PrimaryKeyRelatedField(queryset=Coupon.objects.all(), required=False, allow_null=True)
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all(), required=False, allow_null=True)
    order = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    all_branch = serializers.BooleanField(write_only=True, required=False, default=True)

    class Meta:
        model = Discount
        fields = [
            'id', 'name', 'description', 'all_branch', 'type', 'off_peak_hours', 'priority', 
            'is_stackable', 'valid_from', 'valid_until', 'coupon', 'tenant', 'branch', 'order'
        ]
        read_only_fields = ['tenant']

    def get_coupon(self, obj):
        """Returns the coupon ID instead of the full object."""
        return obj.coupon.id if obj.coupon else None

    def get_branch(self, obj):
        """Returns branch details to reduce queries."""
        return {'id': obj.branch.id, 'address': obj.branch.address} if obj.branch else None

    def get_tenant(self, obj):
        """Returns tenant details to avoid unnecessary queries."""
        return {'id': obj.tenant.id, 'restaurant_name': obj.tenant.restaurant_name} if obj.tenant else None

    def create(self, validated_data):
        """Optimized bulk creation to handle multiple branches efficiently."""
        all_branch = validated_data.pop('all_branch', False)
        user = self.context['request'].user
        tenant = get_object_or_404(Tenant, admin=user)

        validated_data['tenant'] = tenant

        if all_branch:
            branches = Branch.objects.filter(tenant=tenant)
            validated_data.pop("branch")
            discounts = [
                Discount(**validated_data, branch=branch)  # Pass branch only here
                for branch in branches
            ]

            with transaction.atomic():
                Discount.objects.bulk_create(discounts)

            return discounts[0]  # Return one instance for API consistency
        else:
            branch = validated_data.pop('branch', None)  # Ensure 'branch' is not duplicated
            validated_data['tenant'] = branch.tenant if branch else tenant
            validated_data['branch'] = branch  # Explicitly assign it back
            return super().create(validated_data)


    def update(self, instance, validated_data):
        """Optimized update to fetch coupon efficiently."""
        coupon_id = validated_data.pop("coupon", None)
        # if coupon_id:
        #     validated_data["coupon"] = get_object_or_404(Coupon, id=coupon_id)

        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Optimized serialization by including related data."""
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        representation['coupon'] = self.get_coupon(instance)
        representation['branch'] = self.get_branch(instance)
        return representation


class DiscountRuleSerializer(serializers.ModelSerializer):
    discount_id = serializers.PrimaryKeyRelatedField(queryset=Discount.objects.all(),write_only=True)
    class Meta:
        model = DiscountRule
        fields = ['id','discount_id','tenant','min_items','combo_size','min_price','applicable_items','excluded_items','buy_quantity','get_quantity','is_percentage','max_discount_amount','created_at','updated_at']
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
    class Meta:
        model = Coupon
        fields = '__all__'
