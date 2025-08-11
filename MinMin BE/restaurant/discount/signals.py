from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Discount, DiscountRule
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Discount)
def discount_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Discount Created",
                    "branch": str(instance.branch_id),
                    "message": f"Discount with type of {instance.type} have been created"
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
                    "type": "Discount Updated",
                    "branch": str(instance.branch_id),
                    "message": f"Discount with type of {instance.type} have been updated"
                }
            }
        )

@receiver(post_delete, sender=Discount)
def discount_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.tenant.id)  # Specific branch group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "Discount Deleted",
                "branch": str(instance.branch_id),
                "message": f"Discount with type {instance.type} have been deleted"
            }
        }
    )

@receiver(post_save, sender=DiscountRule)
def discountRule_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "Discount Rule Created",
                    "message": f"Discount Rule with ID of {instance.id} have been created"
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
                    "type": "Discount Rule Updated",
                    "message": f"Discount rule with ID {instance.id} has been updated"
                }
            }
        )

@receiver(post_delete, sender=DiscountRule)
def menu_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.tenant.id)  # Specific branch group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "Discount Rule Deleted",
                "message": f"Discount Rule with ID {instance.id} has been deleted"
            }
        }
    )