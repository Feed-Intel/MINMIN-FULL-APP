from rest_framework import serializers
from .models import QRCode
from restaurant.branch.models import Branch
from restaurant.tenant.models import Tenant
from restaurant.table.models import Table

class QRCodeSerializer(serializers.ModelSerializer):
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    class Meta:
        model = QRCode
        fields = ['id', 'tenant', 'branch', 'table', 'qr_code_url']
        read_only_fields = ['tenant', 'branch']
    
    def get_tenant(self, obj):
        return {
            'id': obj.tenant.id,
            'restaurant_name': obj.tenant.restaurant_name
        }

    def get_branch(self, obj):
        return {
            'id': obj.branch.id,
            'address': obj.branch.address
        }

    def get_table(self, obj):
        return {
            'id': obj.table.id,
            'table_code': obj.table.table_code,
            'is_fast_table': obj.table.is_fast_table,
            'is_delivery_table': obj.table.is_delivery_table,
            'is_inside_table': obj.table.is_inside_table,
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tenant'] = self.get_tenant(instance)
        representation['branch'] = self.get_branch(instance)
        representation['table'] = self.get_table(instance)
        return representation
