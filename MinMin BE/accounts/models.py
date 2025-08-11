from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.contrib.gis.db import models as gis_models
from restaurant.branch.models import Branch
from django.utils.timezone import now
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
    user_folder = os.path.join('images', str(instance.id))
    full_path = os.path.join(MEDIA_ROOT, user_folder)

    # Ensure directory exists
    if not os.path.exists(full_path):
        os.makedirs(full_path, exist_ok=True)

    return os.path.join(user_folder, filename)

# Custom manager for the User model
class CustomUserManager(BaseUserManager):
    # Method to create a regular user
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Method to create a superuser with admin privileges
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('user_type', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_staff'):
            raise ValueError("Superuser must have is_staff=True.")
        if not extra_fields.get('is_superuser'):
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

# Custom User model
class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        primary_key=True,  # Set as primary key
        default=uuid.uuid4,  # Default value is a new UUID
        editable=False,  # Prevent manual editing
        auto_created=True
    )
    full_name = models.CharField(max_length=255, blank=True, null=True)  # User's full name
    phone = models.CharField(max_length=15, blank=True, null=True)  # User's phone number
    email = models.EmailField(unique=True, blank=True, null=True)  # User's email address
    USER_TYPE_CHOICES = (  # Different types of users
        ('customer', 'Customer'),
        ('restaurant', 'Restaurant'),
        ('branch', 'Branch'),
        ('admin', 'Admin'),
    )
    image = models.ImageField(upload_to=user_image_path,null=True,blank=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='customer')
    push_token = models.CharField(max_length=255, blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)  # User's birthday
    branch = models.OneToOneField(Branch, on_delete=models.DO_NOTHING, blank=True, null=True)  # User's branch
    otp = models.CharField(max_length=255, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    failed_attempts = models.IntegerField(default=0)  # Track failed login attempts
    locked_until = models.DateTimeField(blank=True, null=True)  # Lock expiration time
    opt_in_promotions = models.BooleanField(default=True)  # Opt-in for promotions
    enable_email_notifications = models.BooleanField(default=True)  # Email notifications
    enable_in_app_notifications = models.BooleanField(default=True)  # In-app notifications
    is_staff = models.BooleanField(default=False) 
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=now)
    updated_at = models.DateTimeField(default=now)
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'  # Identifier for login
    REQUIRED_FIELDS = ['full_name']  # Additional fields required for user creation

    def save(self, *args, **kwargs):
        """
        Override save method to process images before saving
        """
        # Check if image is new or changed
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
                logger.error(f"Error processing image for user {self.email}: {str(e)}")
                # If processing fails, keep the original image
        
        # For new users, save first to generate UUID
        if not self.id:
            super().save(*args, **kwargs)
            
            # After initial save, process image if needed
            if self.image:
                self.image.name = user_image_path(self, self.image.name)
                super().save(update_fields=['image'])
        else:
            super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.email} ({self.user_type})"  # String representation of the user