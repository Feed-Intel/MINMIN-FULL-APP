from rest_framework import serializers
from restaurant.qr_code.models import QRCode
from .models import Table
from minminbe import settings
from restaurant.branch.models import Branch
from restaurant.qr_code.serializers import QRCodeSerializer
from .utils import generate_qr_code
import os

class TableSerializer(serializers.ModelSerializer):
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())
    qr_code = QRCodeSerializer(read_only=True)
    class Meta:
        model = Table
        fields = ['id','branch','table_code','qr_code','is_fast_table','is_delivery_table','is_inside_table']
    
    def sanitize_filename(self, filename):
        """
        Removes invalid characters from filenames to ensure compatibility across filesystems.
        """
        import re
        # Replace invalid characters with underscores
        return re.sub(r'[<>:"/\\|?*\n]', '_', filename)
        
    def create(self, validated_data):
        table = Table.objects.create(**validated_data)
        tenant = table.branch.tenant
        branch = table.branch

        # Generate the URL
        base_url = settings.FRONTEND_BASE_URL
        if table:
            url = f"{base_url}/order?tenant={tenant.id}&branch={branch.id}&table={table.id}"
        else:
            url = f"{base_url}/menu?tenant={tenant.id}&branch={branch.id}"

        # Generate and save the QR code
        qr_code_file = generate_qr_code(url)

        # Sanitize folder and file names
        sanitized_tenant_id = self.sanitize_filename(str(tenant.id))
        sanitized_branch_address = self.sanitize_filename(branch.address)

        folder_path = os.path.join(settings.MEDIA_ROOT, f"qr_codes/{sanitized_tenant_id}/{sanitized_branch_address}")
        os.makedirs(folder_path, exist_ok=True)

        file_name = f"{table.id or 'default'}.png"
        file_path = os.path.join(folder_path, file_name)
        with open(file_path, 'wb') as f:
            f.write(qr_code_file.read())

        # Create the QRCode instance
        QRCode.objects.create(
            tenant=tenant,  # Pass the Tenant instance
            branch=branch,  # Pass the Branch instance
            table=table,    # Pass the Table instance (or None)
            qr_code_url=os.path.join(settings.MEDIA_URL, f"qr_codes/{sanitized_tenant_id}/{sanitized_branch_address}/{file_name}"),
        )
        return table
    def get_branch(self, obj):
        return {
            'id': obj.branch.id,
            'tenant': obj.branch.tenant_id,
            'address': obj.branch.address
        }
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['branch'] = self.get_branch(instance)
        return representation