from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Combo
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Combo)
def combo_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Combo Created",
                    "message": f"Combo {instance.name} have been created"
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
                    "type": "Combo Updated",
                    "message": f"Combo {instance.name} have been updated"
                }
            }
        )

@receiver(post_delete, sender=Combo)
def menu_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.tenant.id)  # Specific branch group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "Combo Deleted",
                "message": f"Combo {instance.name} have been deleted"
            }
        }
    )
    