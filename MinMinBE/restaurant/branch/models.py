from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.gis.db import models as gis_models
from restaurant.tenant.models import Tenant
import uuid

class Branch(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        auto_created=True
    )
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='branches'
    )
    address = models.CharField(max_length=255)
    location = gis_models.PointField(geography=True, null=True, blank=True,spatial_index=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, using=None, keep_parents=False):
        if (
            self.branch_combos.exists() or 
            self.branch_discounts.exists() or 
            self.branch_menu_availabilities.exists() or 
            self.branch_qr_codes.exists() or 
            self.tables.exists() or 
            self.branch_order.exists()
        ):
            raise ValidationError("This branch cannot be deleted because it has related records.")
        super().delete(using, keep_parents)

    def __str__(self):
        return self.address