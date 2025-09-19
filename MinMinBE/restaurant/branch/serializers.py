from rest_framework import serializers
from django.contrib.gis.geos import Point

from restaurant.menu_availability.serializers import MenuAvailabilitySerializer
from restaurant.table.serializers import TableSerializer
from .models import Branch
from restaurant.tenant.models import Tenant

class BranchSerializer(serializers.ModelSerializer):
    tables = TableSerializer(many=True, read_only=True)
    branch_menu_availabilities = MenuAvailabilitySerializer(many=True, read_only=True)
    distance_km = serializers.SerializerMethodField()

    # Accept lat/lng as input
    lat = serializers.FloatField(write_only=True, required=False)
    lng = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = Branch
        fields = [
            'id', 'tenant', 'tables', 'address', 'location','branch_menu_availabilities', 
            'is_default', 'created_at', 'distance_km', 'lat', 'lng'
        ]
        read_only_fields = ['tenant', 'distance_km']

    def validate(self, attrs):
        lat = attrs.pop('lat', None)
        lng = attrs.pop('lng', None)

        if lat is not None and lng is not None:
            attrs['location'] = Point(lng, lat, srid=4326)
        elif self.instance is None:
            # On create, location is optional or required as per your logic
            # If location is not provided on creation, it should be set to None or handled as per your model's field definition
            attrs['location'] = None 
        return attrs

    def get_distance_km(self, obj):
        if hasattr(obj, 'distance') and obj.distance is not None:
            return round(obj.distance.km, 2)
        return None
    
    def get_branch_menu_availabilities(self, obj):
        for menu_avl in obj.branch_menu_availabilities.all():
            if menu_avl.is_available:
                yield {
                    "id": menu_avl.id,
                    "menu_item": {
                        "id": menu_avl.menu_item.id,
                        "name": menu_avl.menu_item.name,
                        "description": menu_avl.menu_item.description,
                        "tags": menu_avl.menu_item.tags,
                        "categories": menu_avl.menu_item.categories,
                        "category": menu_avl.menu_item.category,
                        "image": self.get_image_url(menu_avl.menu_item),
                        "price": menu_avl.menu_item.price,
                        "is_side": menu_avl.menu_item.is_side,
                        "average_rating": menu_avl.menu_item.average_rating
                    },
                    "is_available": menu_avl.is_available,
                    "special_notes": menu_avl.special_notes,
                    "updated_at": menu_avl.updated_at
                }
    def get_image_url(self, menu_item):
        request = self.context.get('request')  
        if menu_item.image:
            return request.build_absolute_uri(menu_item.image.url) if request else menu_item.image.url
        return None

    def create(self, validated_data):
        user = self.context['request'].user
        tenant = Tenant.objects.get(admin=user)
        branch = Branch.objects.create(
            tenant=tenant,
            **validated_data
        )
        from restaurant.table.models import Table
        Table.objects.create(branch=branch, is_delivery_table=True)
        return branch

    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        
        # Convert PointField to lat/lng in output
        representation['branch_menu_availabilities'] = list(self.get_branch_menu_availabilities(instance))
        if instance.location:
            representation['location'] = {
                'lat': str(instance.location.y) if instance.location.y is not None else "",
                'lng': str(instance.location.x) if instance.location.x is not None else ""
            }
        else:
            representation['location'] = None

        if representation.get('distance_km') is None:
            representation.pop('distance_km')
        return representation
