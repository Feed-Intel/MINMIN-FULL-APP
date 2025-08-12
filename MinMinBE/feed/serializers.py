from rest_framework import serializers
from .models import Post, Comment, Tag, Share
from accounts.models import User
import json

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="user.full_name") 

    class Meta:
        model = Comment
        fields = "__all__"
    
    def get_image_url(self, user):
        request = self.context.get('request')  
        if user.image:
            return request.build_absolute_uri(user.image.url) if request else user.image.url
        return None
    
    def get_user(self, obj):
        return {
            "full_name": obj.user.full_name,
            "image": self.get_image_url(obj.user)
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['user'] = self.get_user(instance)
        return representation

class PostSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="user.full_name") 
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    tags = serializers.ListField(child=serializers.CharField(), write_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    image = serializers.ImageField(required=False)
    bookmarks_count = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    shares_count = serializers.IntegerField(source='share_count', read_only=True)
    tenant_id = serializers.SerializerMethodField()
    class Meta:
        model = Post
        fields = ["id", "user", "image", "caption", "time_ago", "location", "tags", "likes_count", "is_liked","comments", "bookmarks_count", "is_bookmarked", "shares_count", "tenant_id"]

    def get_likes_count(self, obj):
        return obj.likes.count() 
    
    def get_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_is_liked(self, obj):
        user = self.context.get("request").user
        if user.is_authenticated:
            return obj.likes.filter(id=user.id).exists()
        return False
    
    def get_bookmarks_count(self, obj):
        return obj.bookmarks.count()
    
    def get_is_bookmarked(self, obj):
        user = self.context.get("request").user
        if user.is_authenticated:
            return obj.bookmarks.filter(id=user.id).exists()
        return False
    
    def get_shares_count(self, obj):
        return obj.shares.count()

    def get_is_shared(self, obj):
        user = self.context.get("request").user
        if user.is_authenticated:
            return obj.shares.filter(id=user.id).exists()
        return False
    
    def get_tenant_id(self, obj):
        user = obj.user
        
        # Check if user is tenant admin
        if hasattr(user, 'tenants') and user.tenants:
            return user.tenants.id
        
        # Check if user belongs to a branch
        if user.branch and hasattr(user.branch, 'tenant'):
            return user.branch.tenant.id
        
        return None

    def validate_tags(self, value):
        """Ensure tags are always a list, even if received as a string."""
        if isinstance(value, str):
            try:
                value = json.loads(value)  # Convert JSON string to Python list
            except json.JSONDecodeError:
                raise serializers.ValidationError("Tags must be a valid JSON list.")
        return value
    def create(self, validated_data):
        tags_data = validated_data.pop("tags", [])  # Extract tags
        post = Post.objects.create(**validated_data)

        if not validated_data.get("image"):
            raise serializers.ValidationError("Image is required.")

        # Process tags: create if they don't exist
        tag_objects = []
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name.strip().lower())  # Ensure uniqueness
            tag_objects.append(tag)
        
        post.tags.set(tag_objects)  # Assign tags to post
        return post

    def update(self, instance, validated_data):
        tags_data = validated_data.pop("tags", [])

        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if tags_data is not None:
            tag_objects = [Tag.objects.get_or_create(name=tag.lower().strip())[0] for tag in tags_data]
            instance.tags.set(tag_objects)

        instance.save()
        return instance
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tags'] = self.get_tags(instance)
        return representation

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"

class ShareSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    post = serializers.StringRelatedField()

    class Meta:
        model = Share
        fields = ['id', 'user', 'post', 'shared_at']

class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'image']

class CommentStatsSerializer(serializers.ModelSerializer):
    user = UserStatsSerializer()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'created_at']

class ShareStatsSerializer(serializers.ModelSerializer):
    user = UserStatsSerializer(allow_null=True)
    
    class Meta:
        model = Share
        fields = ['id', 'user', 'shared_at']

