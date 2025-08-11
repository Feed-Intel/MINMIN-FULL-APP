from django.contrib import admin
from .models import QRCode

@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'tenant_id', 'branch_id', 'table_id', 'qr_code_url', 'created_at')
    search_fields = ('tenant_id', 'branch_id', 'table_id')
    list_filter = ('tenant_id', 'branch_id')
