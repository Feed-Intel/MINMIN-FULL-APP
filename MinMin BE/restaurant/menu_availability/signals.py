# your_app/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache # Import Django's caching API


from .models import MenuAvailability, Branch # Import models relevant to your cache keys
from feed.models import Post # Assuming Post model is in 'feed' app
from customer.feedback.models import Feedback # Assuming Feedback model is in 'customer.feedback' app

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from core.redis_client import redis_client

# --- Existing Notification Logic (Do Not Change) ---
@receiver(post_save, sender=MenuAvailability)
def menuAvailability_created_notification(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.branch.tenant.id)

    if created:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Menu Availability Created",
                    "branch": str(instance.branch.id),
                    "message": f"{instance.menu_item.name} is Now available at {instance.branch.address} branch"
                }
            }
        )
    else:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Menu Availability Updated",
                    "branch": str(instance.branch.id),
                    "message": f"Menu Availability for {instance.menu_item.name} at {instance.branch.address} branch have been updated"
                }
            }
        )

@receiver(post_delete, sender=MenuAvailability)
def RelatedMenuItem_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.branch.tenant.id)
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "Menu Availability Deleted",
                "branch": str(instance.branch.id),
                "message": f"Menu Availability for {instance.menu_item.name} at {instance.branch.address} branch have been deleted"
            }
        }
    )

# --- New Cache Invalidation Logic ---

# Assuming 'redis_client' is available globally or can be imported.
# If 'redis_client' is a direct redis-py client, ensure it's imported or defined here.
# For example: from core.redis_client import redis_client
# Or, if using django-redis, you can primarily rely on `django.core.cache.cache`
# which uses your configured default Redis backend. For `scan_iter`, you might need
# to access the underlying client, e.g., `cache.client.get_client()`.
# Let's assume you have a `redis_client` for `scan_iter` operations.
# from core.redis_client import redis_client # Uncomment and ensure this import is correct

def invalidate_menu_availability_related_caches(sender, instance, **kwargs):
    """
    Function to invalidate caches related to MenuAvailability instances
    and other general menu-related caches.
    """
    print(f"Signal received: {sender.__name__} {instance.id} changed. Invalidating caches...")

    # Invalidate all customer-specific MenuAvailability querysets.
    # This pattern matches keys like 'menu_availability_qs_customer:USER_ID:LOC_DATA:FILTERS_DATA'
    # Use the `scan_iter` method from your `redis_client` for efficient key traversal.
    # Assuming 'redis_client' is an instance of a Redis client that supports scan_iter.
    try:
        # If your `redis_client` is a direct `redis.Redis` instance:
        # from core.redis_client import redis_client
        for key in redis_client.scan_iter("menu_availability_qs_customer:*"):
            redis_client.delete(key)
    except NameError:
        # Fallback for django-redis cache if scan_iter is needed and direct client isn't globally available.
        # This accesses the underlying redis-py client from the Django cache.
        if hasattr(cache, 'client') and hasattr(cache.client, 'get_client'):
            # For django-redis, the 'client' attribute gives access to the underlying redis-py client
            for key in cache.client.get_client().scan_iter("menu_availability_qs_customer:*"):
                cache.client.get_client().delete(key)
        else:
            print("Warning: redis_client not found or does not support scan_iter. Cannot invalidate specific pattern caches.")

    # Invalidate general action caches (these are likely cached using django.core.cache)
    cache.delete("best_dishes")
    cache.delete("recommended_items")
    cache.delete("available_categories")
    print("Related caches cleared.")

# Connect the cache invalidation function to relevant signals
@receiver(post_save, sender=MenuAvailability)
@receiver(post_delete, sender=MenuAvailability)
def menu_availability_cache_invalidation_handler(sender, instance, **kwargs):
    invalidate_menu_availability_related_caches(sender, instance)

# Optional: Invalidate if related models change (e.g., Branch location, Post content, Feedback)
# You need to import these models at the top of this file.
@receiver(post_save, sender=Branch)
@receiver(post_delete, sender=Branch)
def branch_changed_invalidate_caches(sender, instance, **kwargs):
    # Changes to Branch location or other properties can affect MenuAvailability querysets
    invalidate_menu_availability_related_caches(sender, instance)

@receiver(post_save, sender=Post)
@receiver(post_delete, sender=Post)
def post_changed_invalidate_caches(sender, instance, **kwargs):
    # Only clear best_dishes if it's directly affected by Post changes
    cache.delete("best_dishes")
    print("Best dishes cache cleared due to Post change.")

@receiver(post_save, sender=Feedback)
@receiver(post_delete, sender=Feedback)
def feedback_changed_invalidate_caches(sender, instance, **kwargs):
    # Only clear recommended_items if it's directly affected by Feedback changes
    cache.delete("recommended_items")
    # If feedback also influences customer MenuAvailability queries (e.g., ratings are used in main list)
    # then also trigger the broader invalidation.
    try:
        # If your `redis_client` is a direct `redis.Redis` instance:
        # from core.redis_client import redis_client
        for key in redis_client.scan_iter("menu_availability_qs_customer:*"):
            redis_client.delete(key)
    except NameError:
        if hasattr(cache, 'client') and hasattr(cache.client, 'get_client'):
            for key in cache.client.get_client().scan_iter("menu_availability_qs_customer:*"):
                cache.client.get_client().delete(key)
    print("Recommended items and customer queryset caches cleared due to Feedback change.")