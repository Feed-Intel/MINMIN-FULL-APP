from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from customer.order.models import OrderItem
from django.core.exceptions import ObjectDoesNotExist

def get_best_dishes_of_week(limit=5):
    """
    Returns the top-selling menu items from orders in the past 7 days.
    """
    one_week_ago = timezone.now() - timedelta(days=7)

    # Aggregate menu items from order items
    best_dishes = (
        OrderItem.objects.filter(order__created_at__gte=one_week_ago)
        .values('menu_item__id')  
        .annotate(order_count=Count('menu_item__id'))  
        .order_by('-order_count')[:limit]  
    )

    # Extract menu item IDs from the result
    menu_ids = [item['menu_item__id'] for item in best_dishes]

    if not menu_ids:
        return []  # Return an empty list if no best dishes are found

    try:
        # Fetch Menu objects
        return MenuAvailability.objects.filter(menu_item__id__in=menu_ids,is_available=True)
    except ObjectDoesNotExist:
        return []  # Handle the case where no matching Menu objects exist



import random
from restaurant.menu_availability.models import MenuAvailability

def get_recommended_items(limit=5):
    """
    Returns randomly selected menu items as fake recommendations.
    """
    all_menu_items = list(MenuAvailability.objects.filter(is_available=True))
    recommended_items = random.sample(all_menu_items, min(limit, len(all_menu_items)))  # Select random items
    return recommended_items