from rest_framework import serializers
from .models import RelatedMenuItem
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant


# ───────────────────────────────
# SIMPLE MENU SERIALIZER
# ───────────────────────────────
class SimpleMenuSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = ['id', 'name', 'price', 'image']

    def get_image(self, obj):
        """Return absolute image URL if request context is available."""
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


# ───────────────────────────────
# SINGLE RELATED MENU ITEM SERIALIZER
# ───────────────────────────────
class RelatedMenuItemSerializer(serializers.ModelSerializer):
    # Use PK for writing
    menu_item = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())
    related_item = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())

    class Meta:
        model = RelatedMenuItem
        fields = ['id', 'tenant', 'menu_item', 'related_item', 'created_at', 'updated_at']
        read_only_fields = ['tenant', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Create a single RelatedMenuItem for the logged-in tenant."""
        user = self.context['request'].user
        tenant = Tenant.objects.get(admin=user)
        return RelatedMenuItem.objects.create(tenant=tenant, **validated_data)

    def to_representation(self, instance):
        """Customize response with nested related info."""
        rep = super().to_representation(instance)
        rep['tenant'] = {
            'id': instance.tenant.id,
            'restaurant_name': instance.tenant.restaurant_name,
        }
        rep['menu_item'] = SimpleMenuSerializer(instance.menu_item, context=self.context).data
        rep['related_item'] = SimpleMenuSerializer(instance.related_item, context=self.context).data
        return rep


# ───────────────────────────────
# BULK CREATION SERIALIZER
# ───────────────────────────────
class RelatedMenuBulkCreateSerializer(serializers.Serializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())
    related_items = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all()),
        allow_empty=True,
        help_text="List of related items with id",
    )

    def create(self, validated_data):
        """Create multiple RelatedMenuItem entries for one menu."""
        user = self.context['request'].user
        tenant = Tenant.objects.get(admin=user)
        menu_item = validated_data['menu_item']
        related_items = validated_data['related_items']

        created_objects = []
        RelatedMenuItem.objects.filter(
                tenant=tenant,
                menu_item=menu_item
            ).delete()
        for related_item in related_items:
            obj = RelatedMenuItem.objects.create(
                tenant=tenant,
                menu_item=menu_item,
                related_item=related_item
            )
            created_objects.append(obj)
        return created_objects

    def to_representation(self, instances):
        """Return serialized list of created RelatedMenuItem objects."""
        return RelatedMenuItemSerializer(instances, many=True, context=self.context).data
