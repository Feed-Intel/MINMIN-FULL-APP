from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Menu
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Menu)
def menu_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Menu Created",
                    "message": f"Menu {instance.name} have been created"
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
                    "type": "Menu Updated",
                    "message": f"Menu {instance.name} have been updated"
                }
            }
        )

@receiver(post_delete, sender=Menu)
def menu_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.tenant.id)  # Specific branch group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "Menu Deleted",
                "message": f"Menu {instance.name} have been deleted"
            }
        }
    )
    