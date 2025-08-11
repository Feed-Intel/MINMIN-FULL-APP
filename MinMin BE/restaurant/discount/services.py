from django.utils import timezone
from django.db.models import Q
from restaurant.menu_availability.models import MenuAvailability
from restaurant.discount.models import Discount

def get_big_discount_items(limit=5):
    """
    Returns menu items that have the biggest discounts.
    """
    now = timezone.now()

    # Get active discounts
    active_discounts = Discount.objects.filter(
        Q(valid_from__lte=now) & (Q(valid_until__gte=now) | Q(valid_until__isnull=True))
    ).order_by('-priority')

    # Collect all applicable menu item IDs
    menu_ids = set()
    for discount in active_discounts:
        rules = discount.discount_discount_rules.all()  # Related DiscountRule objects
        for rule in rules:
            if isinstance(rule.applicable_items, list):  # Ensure it's a list
                menu_ids.update(rule.applicable_items)

    # Fetch Menu items based on collected IDs
    discounted_menus = MenuAvailability.objects.filter(menu_item__in=list(menu_ids),is_available=True)[:limit]

    return discounted_menus

