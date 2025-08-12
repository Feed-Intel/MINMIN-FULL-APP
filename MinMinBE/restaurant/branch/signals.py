from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Branch
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from restaurant.table.models import Table

@receiver(post_save, sender=Branch)
def branch_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Branch Created",
                    "branch": str(instance.id),
                    "message": f"Branch at {instance.address} have been created"
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
                    "type": "Branch Updated",
                    "branch": str(instance.id),
                    "message": f"Branch at {instance.address} have been updated"
                }
            }
        )
@receiver(post_save, sender=Branch)
def create_delivery_table(sender, instance, created, **kwargs):
        """Create a delivery table when a new Branch is created."""
        if created:
            Table.objects.create(
                branch=instance,
                is_delivery_table=True,
            )
@receiver(post_delete, sender=Branch)
def branch_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.tenant.id)  # Specific branch group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "Branch Deleted",
                "branch": str(instance.id),
                "message": f"Branch at {instance.address} have been deleted"
            }
        }
    )
    