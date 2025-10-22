from rest_framework import serializers
from .models import MenuAvailability
from restaurant.branch.models import Branch
from restaurant.tenant.models import Tenant
from restaurant.menu.models import Menu
from feed.serializers import PostSerializer
from customer.feedback.serializers import FeedbackSerializer

class MenuAvailabilitySerializer(serializers.ModelSerializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=Menu.objects.all())
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    class Meta:
        model = MenuAvailability
        fields = ['id', 'branch', 'menu_item', 'is_available', 'special_notes', 'updated_at']

    def get_branch(self, obj):
        distance_km = None
        tenant = obj.branch.tenant
        admin = tenant.admin
        posts = getattr(admin, 'prefetched_posts', [])
        feedbacks = getattr(tenant, 'prefetched_feedbacks', [])
        if hasattr(obj, 'distance') and obj.distance is not None:
            distance_km = round(obj.distance.km, 2)
        branch_location = obj.branch.location
        location_payload = None
        if branch_location:
            # Ensure both coordinates are available before attempting to read
            try:
                location_payload = {
                    'type': 'Point',
                    'coordinates': [branch_location.x, branch_location.y],
                }
            except Exception:
                location_payload = None

        return {
            'id': obj.branch.id,
            'address': obj.branch.address,
            'tenant': {
                'id': obj.branch.tenant.id,
                'restaurant_name': obj.branch.tenant.restaurant_name,
                'CHAPA_API_KEY': obj.branch.tenant.CHAPA_API_KEY,
                'CHAPA_PUBLIC_KEY': obj.branch.tenant.CHAPA_PUBLIC_KEY,
                'tax': obj.branch.tenant.tax,
                'service_charge': obj.branch.tenant.service_charge,
                'average_rating': obj.branch.tenant.average_rating,
                'image': self.get_tenant_image_url(obj.branch.tenant),
                'profile': obj.branch.tenant.profile,
                'posts': PostSerializer(posts, many=True, context=self.context).data,
                'feedbacks': FeedbackSerializer(feedbacks, many=True, context=self.context).data,
            },
            'distance_km': distance_km,
            'location': location_payload,
        }
    
    def get_is_global(self, obj):
        user = self.context['request'].user
        if user.user_type in ['admin', 'restaurant']:
            tenant = Tenant.objects.get(admin=user)
            return Branch.objects.filter(tenant=tenant).count() == MenuAvailability.objects.filter(menu_item=obj).count()
        return False
    
    def get_branches(self, obj):
        return MenuAvailability.objects.filter(menu_item=obj).values_list('branch_id', flat=True)
    
    def get_menu_item(self, obj):
        return {
            'id': obj.menu_item.id,
            'name': obj.menu_item.name,
            'description': obj.menu_item.description,
            'tags': obj.menu_item.tags,
            'categories': obj.menu_item.categories,
            'category': obj.menu_item.category,
            'image': self.get_image_url(obj.menu_item),
            'price': obj.menu_item.price,
            'is_side': obj.menu_item.is_side,
            'average_rating': obj.menu_item.average_rating,
            'is_global': self.get_is_global(obj.menu_item),
            'branches': self.get_branches(obj.menu_item)
        }
    
    def get_tenant_image_url(self, tenant):
        request = self.context.get('request')  
        if tenant.image:
            return request.build_absolute_uri(tenant.image.url) if request else tenant.image.url
        return None
    
    def get_image_url(self, menu_item):
        request = self.context.get('request')  
        if menu_item.image:
            return request.build_absolute_uri(menu_item.image.url) if request else menu_item.image.url
        return None
    
    def to_representation(self, instance):
        """
        Customizes the serialized response.
        """
        representation = super().to_representation(instance)
        # Replace write-only fields with full detail serializers
        representation['menu_item'] = self.get_menu_item(instance)
        representation['branch'] = self.get_branch(instance)
        return representation
    
    
    def create(self, validated_data):
        """
        Customizes the create behavior.
        """
        menuAvailability, created = MenuAvailability.objects.get_or_create(branch=validated_data.get('branch'),menu_item=validated_data.get('menu_item'))
        menuAvailability.is_available = validated_data.get('is_available')
        menuAvailability.save()
        return menuAvailability
    
