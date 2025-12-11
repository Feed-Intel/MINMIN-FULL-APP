from django.utils import timezone
from django.db.models import Q
from decimal import Decimal
from restaurant.discount.models import DiscountRule, Coupon, CouponUsage
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant

import random

def calculate_discount(order, coupon=None):
    items = order.items.all()
    items_data = [{
        'menu_item': str(item.menu_item.id),
        'quantity': item.quantity,
        'price': float(item.price)
    } for item in items]
    order_total = float(order.calculate_total())
    return calculate_discount_from_data(order.tenant, items_data, coupon, order_total)

def calculate_discount_from_data(tenant, items_data, coupon, order_total, customer=None, branch=None, increment=False, discountApplied=False):
    now = timezone.now()
    total_items = sum(item['quantity'] for item in items_data)
    
    # --- 1. Candidate Discounts (Ordered by Priority) ---
    discounts_qs = DiscountRule.objects.filter(
        tenant=tenant
    ).filter(
        Q(discount_id__valid_from__lte=now) | Q(discount_id__valid_from__isnull=True),
        Q(discount_id__valid_until__gte=now) | Q(discount_id__valid_until__isnull=True)
    )
    if branch:
        discounts_qs = discounts_qs.filter(Q(discount_id__branches=branch) | Q(discount_id__is_global=True))
    
    discounts = discounts_qs.order_by('-discount_id__priority')

    # --- 2. Candidate Coupon Discount ---
    coupon_discount = Decimal("0.00")
    if coupon:
        coupons = Coupon.objects.filter(
            tenant_id=tenant, # Use tenant_id for better performance if possible
            discount_code=coupon,
            is_valid=True
        ).filter(
            Q(valid_from__lte=now) | Q(valid_from__isnull=True),
            Q(valid_until__gte=now) | Q(valid_until__isnull=True)
        )
        if coupons.exists():
            c = coupons.first()
            if branch:
                coupons = coupons.filter(Q(branches=branch) | Q(is_global=True))
                c = coupons.first() # Re-select after branch filter
                
            if c and not CouponUsage.objects.filter(coupon=c, customer=customer).exists():
                if c.is_percentage:
                    coupon_discount = Decimal(str(order_total)) * (Decimal(str(c.discount_amount)) / Decimal("100"))
                else:
                    coupon_discount = Decimal(str(c.discount_amount))

    stackable_discount_total = Decimal("0.00")
    best_non_stackable_discount = Decimal("0.00")
    
    final_automatic_discount = Decimal("0.00")
    typeDiscount = None
    freeItems = []

    for discount in discounts:
        current_discount_value = Decimal("0.00")
        current_free_items = []
        discount_type = discount.discount_id.type
        rules = discount.discount_id.discount_discount_rules.all()

        for rule in rules:
            # --- Volume Discount ---
            if discount_type == 'volume':
                if rule.min_items and total_items >= rule.min_items:
                    if rule.is_percentage:
                        current_discount_value += Decimal(str(order_total)) * (Decimal(str(float(rule.max_discount_amount) / 100)))
                    else:
                        current_discount_value += Decimal(str(min(order_total, float(rule.max_discount_amount))))
            
            # --- Combo Discount ---
            elif discount_type == 'combo':
                # Assuming combo logic is simpler (e.g., minimum total items)
                if rule.combo_size and total_items >= rule.combo_size:
                    # Combo is usually a fixed or percentage discount on the total
                    current_discount_value += Decimal(str(min(order_total, float(rule.max_discount_amount))))

            # --- BOGO Discount (Monetary Discount) ---
            elif discount_type == 'bogo':
                for item in items_data:
                    menu_item_id = str(item['menu_item'])

                    if menu_item_id in rule.applicable_items and item['quantity'] >= rule.buy_quantity:
                        sets_earned = item['quantity'] // rule.buy_quantity
                        total_free_quantity = sets_earned * rule.get_quantity

                        if total_free_quantity > 0:
                            current_free_items.append({menu_item_id: total_free_quantity})
                            try:
                                item_price = Menu.objects.get(id=menu_item_id).price
                                current_discount_value += Decimal(str(item_price)) * Decimal(str(total_free_quantity))
                            except Menu.DoesNotExist:
                                pass


            # --- Free Item Discount (Monetary Discount + Free Item) ---
            elif discount_type == 'freeItem':
                for item in items_data:
                    menu_item_id = str(item['menu_item'])
                    if menu_item_id in rule.applicable_items and item['quantity'] >= rule.buy_quantity and rule.free_items:
                        sets_earned = item['quantity'] // rule.buy_quantity
                        free_quantity_per_set = rule.get_quantity
                        
                        if sets_earned > 0:
                            free_item_id = random.choice(rule.free_items)
                            total_free_quantity = sets_earned * free_quantity_per_set
                            current_free_items.append({free_item_id: total_free_quantity})
                            try:
                                free_item_price = Menu.objects.get(id=free_item_id).price
                                current_discount_value += Decimal(str(free_item_price)) * Decimal(str(total_free_quantity))
                            except Menu.DoesNotExist:
                                pass

        if current_discount_value > 0:
            if discount.discount_id.is_stackable:
                stackable_discount_total += current_discount_value
                freeItems.extend(current_free_items)
            else:
                if current_discount_value > best_non_stackable_discount:
                    best_non_stackable_discount = current_discount_value
                    final_automatic_discount = current_discount_value
                    if discount_type == 'freeItem':
                        final_automatic_discount = 0
                    typeDiscount = discount_type
                    freeItems = current_free_items 

    if stackable_discount_total > final_automatic_discount:
        final_automatic_discount = stackable_discount_total
        typeDiscount = 'stackable_money'

    if coupon_discount > final_automatic_discount:
        best_discount = coupon_discount
        typeDiscount = 'coupon'
        freeItems = [] 
    else:
        best_discount = final_automatic_discount

    if typeDiscount != 'freeItem' and typeDiscount != 'bogo':
        freeItems = []
        
    order_total_decimal = Decimal(str(order_total))
    
    return min(best_discount, order_total_decimal), typeDiscount, freeItems




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
