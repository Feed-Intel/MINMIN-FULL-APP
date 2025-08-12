from django.db import models
from restaurant.tenant.models import Tenant
from django.core.exceptions import ValidationError
from alpha.settings import MEDIA_ROOT
import uuid
import os
from PIL import Image
import io
import logging
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = logging.getLogger(__name__)

def tenant_image_path(instance, filename):
    """
    Function to define the upload path for images based on tenantID.
    Ensures the tenant directory is created before saving the image.
    """
    tenant_folder = os.path.join('images', str(instance.tenant.id))
    full_path = os.path.join(MEDIA_ROOT, tenant_folder)

    # Ensure directory exists
    if not os.path.exists(full_path):
        os.makedirs(full_path, exist_ok=True)

    return os.path.join(tenant_folder, filename)


class Menu(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        auto_created=True
    )
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to=tenant_image_path)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='menus')
    description = models.TextField()
    tags = models.JSONField(default=list)
    category = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_side = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Process image only if it's newly uploaded/changed
        if self.image and not getattr(self.image, '_committed', True):
            try:
                # Open image using Pillow
                with Image.open(self.image) as img:
                    # Convert to RGB mode if needed (removes alpha channel)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Create in-memory bytes buffer
                    output = io.BytesIO()
                    
                    # Save as optimized WEBP with quality control
                    img.save(
                        output, 
                        format='WEBP',
                        quality=70,          # Quality setting (0-100)
                        method=6,            # Best compression
                        lossless=False       # Lossy compression for smaller size
                    )
                    output.seek(0)
                    
                    # Generate new filename with webp extension
                    base, ext = os.path.splitext(self.image.name)
                    filename = base + '.webp'
                    
                    # Replace original file with compressed version
                    self.image = InMemoryUploadedFile(
                        output,
                        'ImageField',
                        filename,
                        'image/webp',
                        output.getbuffer().nbytes,
                        None
                    )
            except Exception as e:
                logger.error(f"Error processing image for {self.name}: {str(e)}")
        
        super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        from restaurant.discount.models import DiscountRule
        if (self.combo_items.exists() or 
            DiscountRule.objects.filter(applicable_items__contains=[str(self.id)]) or 
            DiscountRule.objects.filter(excluded_items__contains=[str(self.id)]) or 
            self.related_menu_items.exists() or 
            self.related_items.exists() or 
            self.menu_cart_items.exists()):
            raise ValidationError("This menu cannot be deleted because it has related records.")
        return super().delete(using, keep_parents)
    
    @property
    def average_rating(self):
        reviews = self.menu_feedbacks.all()
        if reviews.exists():
            return round(reviews.aggregate(models.Avg('overall_rating'))['overall_rating__avg'], 2)
        return None
    
    def __str__(self):
        return self.name