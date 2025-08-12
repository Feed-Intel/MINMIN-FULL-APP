from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import QRCode
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=QRCode)
def qrCode_created_notification(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        group_name = str(instance.tenant.id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_restaurant_notification",
                "message": {
                    "type": "QRCode Created",
                    "branch": str(instance.branch.id),
                    "message": f"QRCode {instance.qr_code_url} have been created"
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
                    "type": "QRCode Updated",
                    "branch": str(instance.branch.id),
                    "message": f"QRCode {instance.qr_code_url} have been updated"
                }
            }
        )

@receiver(post_delete, sender=QRCode)
def QRCode_deleted_notification(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    group_name = str(instance.tenant.id)  # Specific branch group
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_restaurant_notification",
            "message": {
                "type": "QRCode Deleted",
                "branch": str(instance.branch.id),
                "message": f"QRCode {instance.qr_code_url} have been deleted"
            }
        }
    )
    