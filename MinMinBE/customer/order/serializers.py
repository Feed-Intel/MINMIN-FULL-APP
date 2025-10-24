from rest_framework import serializers
from .utils import calculate_discount

from .models import Order, OrderItem
from restaurant.table.models import Table
from restaurant.table.serializers import TableSerializer
from restaurant.branch.models import Branch
from accounts.models import User

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.SerializerMethodField()
    menu_item_image = serializers.SerializerMethodField()
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name','menu_item_image', 'quantity', 'price','remarks']
    def get_menu_item_name(self, obj):
        return obj.menu_item.name
    
    def get_menu_item_image(self, obj):
        request = self.context.get('request')  # Get request object if available
        if obj.menu_item.image:
            return request.build_absolute_uri(obj.menu_item.image.url) if request else obj.menu_item.image.url
        return None

class OrderSerializer(serializers.ModelSerializer):
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all(), write_only=True, allow_null=True,required=False)
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all(), write_only=True, allow_null=True,required=False)
    items = OrderItemSerializer(many=True)
    total_price = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = [
            'id','order_id', 'tenant','items',"customer_name","customer_phone", "customer_tinNo", 
            'table','branch', 'customer', 'total_price', 'status', 'discount_amount', 'created_at', 'updated_at'
        ]
        read_only_fields = ['customer','total_price','tenant']

    def get_total_price(self, obj):
        return obj.calculate_total()
    
    def get_discount_amount(self, obj):
        return calculate_discount(obj)

    def create(self, validated_data):
        """Handle automatic table assignment during order creation."""
        # Get or find the table
        table = validated_data.get('table')
        branch = validated_data.get('branch')
        items_data = validated_data.pop('items')

        customer_name = validated_data.get('customer_name')
        customer_phone = validated_data.get('customer_phone')
        customer_tinNo = validated_data.get('customer_tinNo')
        customer = self.context['request'].user
        if customer.user_type != 'customer':
            new_user,created = User.objects.get_or_create(
                password='password',
                full_name=customer_name,
                user_type='customer',
                phone=customer_phone,
                tin_no=customer_tinNo
            )
            customer = new_user
        
        # Automatically assign delivery table if none provided
        if not table:
            table = Table.objects.filter(
                branch=branch,
                is_delivery_table=True
            ).first()

            if not table:
                delivery_table_serializer = TableSerializer(
                    data={
                        'branch': branch.id,
                        'is_delivery_table': True,
                        'is_fast_table': False,
                        'is_inside_table': False,
                    }
                )
                delivery_table_serializer.is_valid(raise_exception=True)
                table = delivery_table_serializer.save()

        # Create order with determined table
        order = Order.objects.create(
            table=table,
            branch=branch,
            tenant=branch.tenant,
            customer=customer
        )

        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                **item_data
            )

        return order

    def update(self, instance, validated_data):
        # Update the table and customer fields
        if 'table' in validated_data:
            instance.table = validated_data.pop('table')
            instance.branch = instance.branch
            instance.tenant = instance.branch.tenant

        if 'customer' in validated_data:
            instance.customer = validated_data.pop('customer')

        instance.status = validated_data.get('status', instance.status)
        instance.save()
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
    
    def get_branch(self, obj):
        branch = obj.branch
        distance_km = None
        if hasattr(obj, 'distance') and obj.distance is not None:
            distance_km = round(obj.distance.km, 2)

        return {
            'id': branch.id,
            'tenant': branch.tenant_id,
            'address': branch.address,
            'distance_km': distance_km,
        }

    
    def get_table(self, obj):
        return {
            'id': obj.table.id,
            'table_code': obj.table.table_code,
            'is_fast_table': obj.table.is_fast_table,
            'is_delivery_table': obj.table.is_delivery_table,
            'is_inside_table': obj.table.is_inside_table,
        }
    def get_customer(self, obj):
        return {
            'id': obj.customer.id,
            'email': obj.customer.email,
            'full_name': obj.customer.full_name,
            'phone':obj.customer.phone
        }
    
    def get_customer_name(self, obj):
        """
        Returns the full name of the customer.
        """
        return obj.customer_name if obj.customer_name else obj.customer.full_name
    
    def get_customer_phone(self, obj):
        """
        Returns the phone number of the customer.
        """
        return obj.customer_phone if obj.customer_phone else obj.customer.phone
    def to_representation(self, instance):
        """
        Customizes the serialized response.
        """
        representation = super().to_representation(instance)
        # Replace write-only fields with full detail serializers
        representation['table'] = self.get_table(instance)
        representation['customer'] = self.get_customer(instance)
        representation['branch'] = self.get_branch(instance)
        representation['tenant'] = self.get_tenant(instance)
        representation['customer_name'] = self.get_customer_name(instance)
        representation['customer_phone'] = self.get_customer_phone(instance)
        representation['customer_tinNo'] = instance.customer_tinNo
        return representation

