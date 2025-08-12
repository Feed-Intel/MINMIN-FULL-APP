from rest_framework import serializers
from .models import Tenant
from restaurant.branch.serializers import BranchSerializer
from restaurant.menu.serializers import MenuSerializer

class TenantSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True,read_only=True)
    menus = MenuSerializer(many=True,read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    average_rating = serializers.SerializerMethodField()
    class Meta:
        model = Tenant
        fields = ['id','restaurant_name','branches','menus','profile','admin','max_discount_limit','image','average_rating','CHAPA_API_KEY','CHAPA_PUBLIC_KEY','tax','service_charge']
        read_only_fields = ['admin','average_rating']
    
    def get_average_rating(self, obj):
        return obj.average_rating if obj.average_rating else None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['branches'] = self.get_branches(instance)
        representation['menus'] = self.get_menus(instance)
        return representation
    
    def get_branches(self, obj):
        for branch in obj.branches.all():
            distance_km = None
            if hasattr(branch, 'distance') and branch.distance is not None:
                distance_km = round(branch.distance.km, 2)
            branch_data = {
                'id': branch.id,
                'address': branch.address,
                'distance_km': distance_km,
            }
            yield branch_data

    
    def get_menus(self, obj):
        for menu in obj.menus.all():
            yield {
                'id': menu.id,
                'name': menu.name,
                'image': self.get_image_url(menu),
                'average_rating': menu.average_rating,
            }
    
    def get_image_url(self, menu):
        request = self.context.get('request')  # Get request object if available
        if menu.image:
            return request.build_absolute_uri(menu.image.url) if request else menu.image.url
        return None

class DashboardSerializer(serializers.Serializer):
    period = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    orders = serializers.IntegerField()
    active_tables = serializers.IntegerField()
    rating = serializers.FloatField()
    chart_data = serializers.DictField()
    revenue_change = serializers.FloatField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)