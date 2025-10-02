from django.db import models
from django.core.exceptions import ValidationError
from restaurant.branch.models import Branch
import uuid

class Table(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        auto_created=True
    )
    table_code = models.CharField(
        max_length=50,
        blank=True,
        editable=False
    )  # Human-readable table code
    branch = models.ForeignKey(
        Branch, 
        on_delete=models.CASCADE, 
        related_name='tables'
    )
    is_fast_table = models.BooleanField(default=False)
    is_delivery_table = models.BooleanField(default=False)
    is_inside_table = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Generate a unique table_code before saving."""
        if not self.table_code:
            branch_code = self.branch.address[:3].upper()  # Use first 3 letters of branch name
            table_count = Table.objects.filter(branch=self.branch).count()
            self.table_code = f"{branch_code}-{table_count + 1:03d}"  # Format: BRN-001
        super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        """Prevent deletion if related records exist."""
        if self.table_order.exists():
            raise ValidationError("This table cannot be deleted because it has related records.")
        return super().delete(using, keep_parents)

    def __str__(self):
        return f"Table {self.table_code} in Branch {self.branch.address}"