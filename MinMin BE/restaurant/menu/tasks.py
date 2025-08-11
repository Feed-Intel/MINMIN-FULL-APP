from celery import shared_task
from .services import get_best_dishes_of_week

@shared_task
def update_best_dishes():
    get_best_dishes_of_week()