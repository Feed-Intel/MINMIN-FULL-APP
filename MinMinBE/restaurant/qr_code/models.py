from django.db import models
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table

from uuid import uuid4

class QRCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='tenant_qr_codes'
    )  # Foreign Key to Tenant
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='branch_qr_codes'
    )  # Foreign Key to Branch
    table = models.OneToOneField(
        Table,
        on_delete=models.CASCADE,
        related_name='qr_code'
    )   
    qr_code_url = models.URLField(max_length=255)  # URL encoded in the QR cod
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.table_id:
            return f"QR Code for Table {self.table_id} in Branch {self.branch_id}"
        return f"QR Code for Branch {self.branch_id}"
