from celery import shared_task
from .services import get_best_dishes_of_week, get_big_discount_items

@shared_task
def update_big_discount_items():
    get_big_discount_items()