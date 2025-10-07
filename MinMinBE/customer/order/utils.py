from django.utils import timezone
from django.db.models import Q
from restaurant.discount.models import DiscountRule, Coupon, CouponUsage
from restaurant.tenant.models import Tenant

def calculate_discount(order, coupon=None):
    items = order.items.all()
    items_data = [{
        'menu_item': str(item.menu_item.id),
        'quantity': item.quantity,
        'price': float(item.price)
    } for item in items]
    order_total = float(order.calculate_total())
    return calculate_discount_from_data(order.tenant, items_data, coupon, order_total)

def calculate_discount_from_data(tenant, items_data, coupon, order_total, customer=None, branch=None):
    now = timezone.now()
    total_items = sum(item['quantity'] for item in items_data)

    # --- Candidate Discounts ---
    discounts = DiscountRule.objects.filter(
        tenant=tenant
    ).filter(
        Q(discount_id__valid_from__lte=now)|Q(discount_id__valid_from__isnull=True),
        Q(discount_id__valid_until__gte=now)|Q(discount_id__valid_until__isnull=True)
    )
    if branch:
        discounts = discounts.filter(Q(discount_id__branches=branch)|Q(discount_id__is_global=True))
    # --- Candidate Coupons ---
    print(discounts)
    coupon_discount = 0.0
    if coupon:
        coupons = Coupon.objects.filter(
            tenant=Tenant.objects.get(id=tenant),
            discount_code=coupon,
            is_valid=True
        ).filter(
            Q(valid_from__lte=now) | Q(valid_from__isnull=True),
            Q(valid_until__gte=now) | Q(valid_until__isnull=True)
        )
        if coupons.exists():
            if branch:
                coupons = coupons.filter(Q(branches=branch)|Q(is_global=True))
            c = coupons.first()
            
            if not CouponUsage.objects.filter(coupon=c, customer=customer).exists():
                if c.is_percentage:
                    coupon_discount = order_total * (float(c.discount_amount) / 100)
                else:
                    coupon_discount = float(c.discount_amount)

                if not c.discount_code.upper().startswith("WELCOME"):
                    c.is_valid = False
                    c.save()

                # Record usage
                if customer:
                    CouponUsage.objects.create(coupon=c, customer_id=customer)

    # --- Apply Discounts (stackable) ---
    discount_amount = 0.0
    for discount in discounts:
        rules = discount.discount_id.discount_discount_rules.all()
        for rule in rules:
            if discount.discount_id.type == 'volume':
                if rule.min_items and total_items >= rule.min_items:
                    if rule.is_percentage:
                        discount_amount += order_total * (float(rule.max_discount_amount) / 100)
                    else:
                        discount_amount += min(order_total, float(rule.max_discount_amount))

            elif discount.discount_id.type == 'combo':
                if rule.combo_size and total_items >= rule.combo_size:
                    discount_amount += min(order_total, float(rule.max_discount_amount))

            elif discount.discount_id.type == 'bogo':
                applicable_items = [
                    (item, i)
                    for item in items_data
                    for i in range(item['quantity'])
                    if str(item['menu_item']) in rule.applicable_items
                ]
                if type(rule.buy_quantity) == 'int' and len(applicable_items) >= rule.buy_quantity:
                    free_items = (len(applicable_items) // rule.buy_quantity) * rule.get_quantity
                    discount_amount += sum(item['price'] for item, _ in applicable_items[:free_items])

            elif discount.discount_id.type == 'freeItem':
                applicable_items = [
                    (item, i)
                    for item in items_data
                    for i in range(item['quantity'])
                    if str(item['menu_item']) in rule.applicable_items
                ]
                if type(rule.buy_quantity) == 'int' and len(applicable_items) >= rule.buy_quantity:
                    free_items = (len(applicable_items) // rule.buy_quantity) * rule.get_quantity
                    discount_amount += sum(item['price'] for item, _ in applicable_items[:free_items])

    # --- Best Discount ---
    best_discount = max(coupon_discount, discount_amount)
    return min(best_discount, order_total)




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
