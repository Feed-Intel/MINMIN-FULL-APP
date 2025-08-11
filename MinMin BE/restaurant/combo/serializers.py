from rest_framework import serializers
from .models import Combo, ComboItem
from restaurant.branch.models import Branch
from restaurant.tenant.models import Tenant
from django.db import transaction

class ComboItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComboItem
        fields = ['id', 'menu_item', 'combo','quantity', 'is_half']
        read_only_fields = ['combo']
    
    def get_menu_item(self, obj):
        return {
            'id': obj.menu_item.id,
            'name': obj.menu_item.name
        }
    
    def get_combo(self, obj):
        return {
            'id': obj.combo.id,
            'name': obj.combo.name,
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['menu_item'] = self.get_menu_item(instance)
        representation['combo'] = self.get_combo(instance)
        return representation

class ComboSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all(), write_only=True,required=False,allow_null=True)
    combo_items = ComboItemSerializer(many=True)
    all_branch = serializers.BooleanField(write_only=True, required=False, default=True)
    class Meta:
        model = Combo
        fields = ['id', 'name', 'tenant','all_branch','branch', 'combo_items', 'is_custom', 'combo_price', 'created_at']
        read_only_fields = ['tenant']

    def create(self, validated_data):
        combo_items_data = validated_data.pop('combo_items')
        all_branch = validated_data.pop('all_branch')
        tenant = Tenant.objects.get(admin=self.context['request'].user)
        if all_branch:
            validated_data.pop('branch')
            for branch in Branch.objects.filter(tenant=tenant):
                with transaction.atomic():
                    combo = Combo.objects.create(
                        tenant=tenant,
                        branch=branch,
                        **validated_data
                    )
                    for combo_item_data in combo_items_data:
                        ComboItem.objects.create(
                            combo=combo,
                            **combo_item_data
                        )

            return combo
        branch = validated_data.pop('branch')
        with transaction.atomic():
            combo = Combo.objects.create(
                tenant=branch.tenant,
                branch=branch,
                **validated_data
            )
            for combo_item_data in combo_items_data:
                ComboItem.objects.create(
                    combo=combo,
                    **combo_item_data
                )

        return combo
    
    def update(self, instance, validated_data):
        combo_items_data = validated_data.pop('combo_items', [])

        with transaction.atomic():
            # Update the fields of the combo instance
            instance.name = validated_data.get('name', instance.name)
            instance.is_custom = validated_data.get('is_custom', instance.is_custom)
            instance.branch = validated_data.get('branch', instance.branch)
            instance.combo_price = validated_data.get('combo_price', instance.combo_price)
            instance.save()

            # Existing combo items keyed by menu_item for quick lookup
            existing_combo_items = {item.menu_item: item for item in instance.combo_items.all()}

            processed_menu_items = set()

            # Process incoming combo items data
            for combo_item_data in combo_items_data:
                menu_item = combo_item_data['menu_item']
                processed_menu_items.add(menu_item)

                if menu_item in existing_combo_items:
                    # Update existing combo item
                    combo_item = existing_combo_items[menu_item]
                    combo_item.quantity = combo_item_data.get('quantity', combo_item.quantity)
                    combo_item.is_half = combo_item_data.get('is_half', combo_item.is_half)
                    combo_item.save()
                else:
                    # Create new combo item if it doesn't exist
                    ComboItem.objects.create(
                        combo=instance,
                        menu_item=menu_item,
                        quantity=combo_item_data['quantity'],
                        is_half=combo_item_data['is_half']
                    )

            # Delete any existing combo items not included in the incoming data
            for menu_item, combo_item in existing_combo_items.items():
                if menu_item not in processed_menu_items:
                    combo_item.delete()

        return instance


    def get_branch(self, obj):
        return {
            'id': obj.branch.id,
            'address': obj.branch.address
        }

    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name,
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        representation['branch'] = self.get_branch(instance)
        return representation
