from django.utils import timezone
from restaurant.discount.models import DiscountRule, Coupon

def calculate_discount(order, coupon=None):
    items = order.items.all()
    items_data = [{
        'menu_item': str(item.menu_item.id),
        'quantity': item.quantity,
        'price': float(item.price)
    } for item in items]
    order_total = float(order.calculate_total())
    return calculate_discount_from_data(order.tenant, items_data, coupon, order_total)

def calculate_discount_from_data(tenant, items_data, coupon, order_total,branch=None):
    discount_amount = 0.0
    total_items = sum(item['quantity'] for item in items_data)
    if branch is None:
        discounts = DiscountRule.objects.filter(tenant=tenant,discount_id__valid_from__lte=timezone.now(),discount_id__valid_until__gte=timezone.now())
    else:
        discounts = DiscountRule.objects.filter(tenant=tenant,discount_id__branch=branch,discount_id__valid_from__lte=timezone.now(),discount_id__valid_until__gte=timezone.now())
    coupons = Coupon.objects.filter(tenant=tenant,discount_code=coupon,valid_from__lte=timezone.now(),valid_until__gte=timezone.now(),is_valid=True)
    if coupons.exists():
        firstCoupon = coupons.first()
        discount_amount +=   order_total * float(firstCoupon.discount_amount)/100 if firstCoupon.is_percentage else float(firstCoupon.discount_amount)
        firstCoupon.is_valid = False
        firstCoupon.save()
    for discount in discounts:
        rules = discount.discount_id.discount_discount_rules.all()
        for rule in rules:
            if rule.min_items and (len(items_data) >= rule.min_items or total_items >= rule.min_items) and not(not discount.discount_id.is_stackable and discount_amount > 0):
                if rule.is_percentage:
                    discount_amount += order_total * (float(rule.max_discount_amount)) / 100
                else:
                    discount_amount += min(order_total, float(rule.max_discount_amount))

            elif discount.discount_id.type == 'combo' and not(not discount.discount_id.is_stackable and discount_amount > 0):
                if rule.combo_size and len(items_data) >= rule.combo_size:
                    discount_amount += min(order_total, float(rule.max_discount_amount))

            elif discount.discount_id.type == 'bogo' and not(not discount.discount_id.is_stackable and discount_amount > 0):
                applicable_items = [item for item in items_data if str(item['menu_item']) in rule.applicable_items]
                if applicable_items and len(applicable_items) >= rule.buy_quantity:
                    free_items = (len(applicable_items) // rule.buy_quantity) * rule.get_quantity
                    discount_amount += sum(item['price'] * item['quantity'] for item in applicable_items[:free_items])

            elif discount.discount_id.type == 'freeItem' and not(not discount.discount_id.is_stackable and discount_amount > 0):
                applicable_items = [item for item in items_data if str(item['menu_item']) in rule.applicable_items]
                excluded_items = [item for item in items_data if str(item['menu_item']) in rule.excluded_items]
                if applicable_items and len(applicable_items) >= rule.buy_quantity:
                    free_items = (len(applicable_items) // rule.buy_quantity) * rule.get_quantity
                    discount_amount += sum(item['price'] * item['quantity'] for item in excluded_items[:free_items])

    return min(discount_amount, order_total)


from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist
from loyalty.models import TenantLoyalty, RestaurantLoyaltySettings

def calculate_redeem_amount(customer_id, tenant_id):
    try:
        tenant_loyalty = TenantLoyalty.objects.filter(customer=customer_id, tenant=tenant_id)
        if not tenant_loyalty.exists():
            return Decimal(0)
        customer_points = tenant_loyalty.first().points
        restaurant_loyalty_settings = RestaurantLoyaltySettings.objects.get(tenant_id=tenant_id)
        threshold = restaurant_loyalty_settings.threshold

        if customer_points >= threshold:
            return customer_points
        else:
            return Decimal(0)

    except ObjectDoesNotExist:
        # Return 0 if any related object is missing
        return Decimal(0)
