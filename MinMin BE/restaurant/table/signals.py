from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Table
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Table)
def table_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.branch.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Table Created",
                    "branch": str(instance.branch.id),
                    "message": f"Table with ID {instance.table_code} have been created"
                }
            }
        )
        
    else:
        channel_layer = get_channel_layer()
        group_name = str(instance.branch.tenant.id)  # Specific Table group
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Table Updated",
                    "branch": str(instance.branch.id),
                    "message": f"Table with ID {instance.table_code} have been updated"
                }
            }
        )

@receiver(post_delete, sender=Table)
def table_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.branch.tenant.id)  # Specific Table group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "Table Deleted",
                "branch": str(instance.branch.id),
                "message": f"Table with ID {instance.table_code} have been deleted"
            }
        }
    )
    