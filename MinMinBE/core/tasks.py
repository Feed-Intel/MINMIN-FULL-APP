from celery import shared_task
from django.apps import apps
from django.core.files.base import ContentFile
from PIL import Image
import io
import os
import logging

logger = logging.getLogger(__name__)

@shared_task
def compress_image_task(model_label, instance_pk, field_name):
    """Compress an image field to WEBP format asynchronously."""
    Model = apps.get_model(model_label)
    if Model is None:
        logger.error("Model %s not found", model_label)
        return
    try:
        instance = Model.objects.get(pk=instance_pk)
    except Model.DoesNotExist:
        logger.error("Instance %s of model %s not found", instance_pk, model_label)
        return

    field = getattr(instance, field_name, None)
    if not field:
        logger.error("Field %s not found on %s", field_name, model_label)
        return
    try:
        if field.name.lower().endswith('.webp'):
            return
        with Image.open(field.path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            output = io.BytesIO()
            img.save(
                output,
                format='WEBP',
                quality=70,
                method=6,
                lossless=False,
            )
            output.seek(0)
            base, _ = os.path.splitext(field.name)
            new_filename = base + '.webp'
            # remove original file
            field.storage.delete(field.name)
            field.save(new_filename, ContentFile(output.read()), save=False)
            instance.save(update_fields=[field_name])
    except Exception as exc:
        logger.error("Error compressing image for %s %s: %s", model_label, instance_pk, exc)
