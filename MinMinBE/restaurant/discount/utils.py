from .models import DiscountApplication

def calculate_discount(order, discount,coupon=None):
    """
    Calculate discount based on the discount type and rules.
    Returns the discount amount if applicable, otherwise 0.
    """
    discount_amount = 0
    rules = discount.discount_discount_rules.all()

    for rule in rules:
        if discount.type == 'volume':
            if rule.min_items and order.items.count() >= rule.min_items:
                if rule.is_percentage:
                    discount_amount = order.calculate_total() * (rule.max_discount_amount / 100)  # Assuming max_discount_amount is percentage
                else:
                    discount_amount = order.calculate_total() - rule.max_discount_amount

        elif discount.type == 'combo':
            if rule.combo_size and len(order.items) >= rule.combo_size:
                discount_amount = min(order.calculate_total(), rule.max_discount_amount)

        elif discount.type == 'bogo':
            applicable_items = [item for item in order.items if item.menu_item.id in rule.applicable_items]
            if len(applicable_items) >= rule.buy_quantity:
                free_items = len(applicable_items) // rule.buy_quantity * rule.get_quantity
                discount_amount = sum(item.price for item in applicable_items[:free_items])

        elif discount.type == 'freeItem':
            applicable_items = [item for item in order.items if item.menu_item.id in rule.applicable_items]
            excluded_items = [item for item in order.items if item.menu_item.id in rule.excluded_items]
            if len(applicable_items) >= rule.buy_quantity:
                free_items = len(applicable_items) // rule.buy_quantity * rule.get_quantity
                discount_amount = sum(item.price for item in excluded_items[:free_items])

        elif discount.type == 'coupon':
            if discount.coupon.discount_code and coupon == discount.coupon.discount_code and order.calculate_total() >= rule.max_discount_amount:
                discount_amount = rule.max_discount_amount
    return discount_amount

def apply_discounts(order, discounts,coupon):
    """
    Apply the discounts to the given order.
    :param order: Order object.
    :param discounts: Queryset of Discount objects.
    :return: A tuple of (applied_discounts, total_discount).
    """
    previous_discounts = [disApp.discount for disApp in DiscountApplication.objects.select_related('discount','order').all()]
    applied_discounts = []
    total_discount = 0

    discounts = sorted(discounts, key=lambda d: d.priority or 0)
    for discount in discounts:
        if (discount.is_stackable or not applied_discounts) and not previous_discounts:
            discount_amount = calculate_discount(order, discount,coupon)
            if discount_amount:
                total_discount += discount_amount
                applied_discounts.append({
                    "discount_id": discount.id,
                    "applied_amount": discount_amount
                })
        if total_discount > (order.tenant.max_discount_limit or float('inf')):
            total_discount = order.tenant.max_discount_limit
            break

    return applied_discounts, total_discount

