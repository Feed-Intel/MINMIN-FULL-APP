from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import RelatedMenuItem
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=RelatedMenuItem)
def relatedMenuItem_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "RelatedMenuItem Created",
                    "message": f"RelatedMenuItem {instance.menu_item.name} and {instance.related_item.name} have been created"
                }
            }
        )
        
    else:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)  # Specific branch group
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Related Menu Item Updated",
                    "message": f"Related Menu Item {instance.menu_item.name} and {instance.related_item.name} have been updated"
                }
            }
        )

@receiver(post_delete, sender=RelatedMenuItem)
def RelatedMenuItem_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.tenant.id)  # Specific branch group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "RelatedMenuItem Deleted",
                "message": f"RelatedMenuItem {instance.menu_item.name} and {instance.related_item.name} have been deleted"
            }
        }
    )
    