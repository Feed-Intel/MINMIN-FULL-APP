from django.db import models
import uuid
import os
from PIL import Image
import io
import logging
from django.core.files.uploadedfile import InMemoryUploadedFile
from accounts.models import User

logger = logging.getLogger(__name__)

def post_image_path(instance, filename):
    """Generate path for post images with user-specific folder"""
    user_folder = f"user_{instance.user.id}"
    return os.path.join('posts', user_folder, filename)

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE,related_name='posts')
    image = models.ImageField(upload_to=post_image_path)  # Updated upload path
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    caption = models.TextField()
    time_ago = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=255)
    tags = models.ManyToManyField('Tag', blank=True)
    bookmarks = models.ManyToManyField(User, related_name='bookmarked_posts', blank=True)
    share_count = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True,db_index=True)


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
                logger.error(f"Error processing image for post {self.id}: {str(e)}")
                # If processing fails, keep the original image
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.full_name}: {self.caption[:20]}"

# Other models remain unchanged
class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name}: {self.text[:20]}"

class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Share(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(
        Post, 
        related_name='shares',
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User,
        related_name='shares',
        on_delete=models.SET_NULL,
        null=True  # Allow anonymous shares
    )
    shared_at = models.DateTimeField(auto_now_add=True)