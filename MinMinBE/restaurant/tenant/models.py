from django.db import models
from django.core.exceptions import ValidationError
from alpha.settings import MEDIA_ROOT
import uuid
import os
from PIL import Image
import io
import logging
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = logging.getLogger(__name__)

def user_image_path(instance, filename):
    """
    Function to define the upload path for images based on tenantID.
    Ensures the tenant directory is created before saving the image.
    """
    user_folder = os.path.join('images', str(instance.restaurant_name))
    full_path = os.path.join(MEDIA_ROOT, user_folder)

    # Ensure directory exists
    if not os.path.exists(full_path):
        os.makedirs(full_path, exist_ok=True)

    return os.path.join(user_folder, filename)

class Tenant(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        auto_created=True
    )
    image = models.ImageField(upload_to=user_image_path, null=True, blank=True)
    restaurant_name = models.CharField(max_length=255)
    profile = models.TextField()
    CHAPA_API_KEY = models.TextField(null=True, blank=True)
    CHAPA_PUBLIC_KEY = models.TextField(null=True, blank=True)
    tax = models.FloatField(default=0.0)
    service_charge = models.FloatField(default=0.0)
    admin = models.OneToOneField(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='tenants',
    )
    max_discount_limit = models.FloatField(default=0.0)
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
                logger.error(f"Error processing image for {self.restaurant_name}: {str(e)}")
                # If processing fails, keep the original image
        
        super().save(*args, **kwargs)

    def delete(self, using = None, keep_parents =False):
        if (self.tenant_carts.exists() or 
            self.tenant_order.exists() or 
            self.restaurant_loyality_settings.exists() or 
            self.tenant_loyality.exists() or 
            self.tenant_loyality_transation.exists() or 
            self.tenant_loyality_conversion_rate.exists() or 
            self.branches.exists() or 
            self.combos.exists() or 
            self.tenant_discounts.exists() or 
            self.tenant_discount_rules.exists() or 
            self.menus.exists() or 
            self.tenant_qr_codes.exists() or 
            self.tenant_related_menu_items.exists()):
            raise ValidationError("This tenant cannot be deleted because it has related records.")
        return super().delete(using, keep_parents)
    
    @property
    def average_rating(self):
        reviews = self.restaurant_feedbacks.all()
        if reviews.exists():
            return round(reviews.aggregate(models.Avg('overall_rating'))['overall_rating__avg'], 2)
        return None

    def __str__(self):
        return self.restaurant_name