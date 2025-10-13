from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from faker import Faker
from decimal import Decimal
from random import randint, choice, sample
import io
from PIL import Image

from accounts.models import User
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table
from restaurant.menu.models import Menu
from restaurant.menu_availability.models import MenuAvailability
from restaurant.combo.models import Combo, ComboItem
from restaurant.discount.models import Discount, DiscountRule, Coupon
from customer.order.models import Order, OrderItem


class Command(BaseCommand):
    """Populate the database with realistic restaurant ordering data."""

    help = "Seed the database with restaurants, customers, menus and orders."

    def add_arguments(self, parser):
        parser.add_argument('--restaurants', type=int, default=5, help='Number of restaurants to create')
        parser.add_argument('--branches', type=int, default=3, help='Number of branches per restaurant')
        parser.add_argument('--tables', type=int, default=10, help='Tables per branch')
        parser.add_argument('--menus', type=int, default=20, help='Menu items per restaurant')
        parser.add_argument('--customers', type=int, default=50, help='Number of customers to create')
        parser.add_argument('--orders', type=int, default=5, help='Orders per customer')

    def handle(self, *args, **options):
        faker = Faker()

        restaurants = options['restaurants']
        branches_per_restaurant = options['branches']
        tables_per_branch = options['tables']
        menus_per_restaurant = options['menus']
        customer_count = options['customers']
        orders_per_customer = options['orders']

        self.stdout.write(self.style.WARNING('Starting database seed...'))

        tenants = []
        menus = []
        branches = []
        tables = []

        # create fixed accounts for admin and demo customer
        if not User.objects.filter(email='admin@example.com').exists():
            User.objects.create_superuser(
                email='admin@example.com',
                password='password',
                full_name='Admin User',
            )
        demo_customer = User.objects.filter(email='customer@example.com').first()
        if not demo_customer:
            demo_customer = User.objects.create_user(
                email='customer@example.com',
                password='password',
                full_name='Demo Customer',
                user_type='customer',
            )

        # create restaurants and related data
        for r in range(restaurants):
            with transaction.atomic():
                admin = User.objects.create_user(
                    email=f'restaurant{r + 1}@example.com',
                    password='password',
                    full_name=faker.company() + ' Admin',
                    user_type='restaurant',
                )
                tenant = Tenant.objects.create(
                    admin=admin,
                    restaurant_name=faker.company(),
                    profile=faker.text(),
                    image=self._fake_image()
                )
                tenants.append(tenant)

                # create branches
                for _ in range(branches_per_restaurant):
                    branch = Branch.objects.create(
                        tenant=tenant,
                        address=faker.address()
                    )
                    branches.append(branch)

                    # create tables
                    for _ in range(tables_per_branch):
                        table = Table.objects.create(
                            branch=branch,
                            is_fast_table=choice([True, False]),
                            is_delivery_table=choice([True, False]),
                            is_inside_table=choice([True, False]),
                            is_active=choice([True, False])
                        )
                        tables.append(table)

                # create menus
                for _ in range(menus_per_restaurant):
                    category_pool = ['Main', 'Drink', 'Dessert']
                    selected_categories = sample(
                        category_pool,
                        k=randint(1, len(category_pool))
                    )
                    menu = Menu.objects.create(
                        tenant=tenant,
                        name=faker.word().title() + ' ' + choice(['Burger', 'Pizza', 'Salad', 'Pasta', 'Soup']),
                        description=faker.paragraph(),
                        price=Decimal(randint(5, 40)),
                        categories=selected_categories,
                        tags=[faker.word() for _ in range(3)],
                        image=self._fake_image()
                    )
                    menus.append(menu)

                # create menu availability for each branch for this tenant
                tenant_menus = [m for m in menus if m.tenant == tenant]
                for branch in [b for b in branches if b.tenant == tenant]:
                    for menu in tenant_menus:
                        MenuAvailability.objects.get_or_create(
                            branch=branch,
                            menu_item=menu,
                            defaults={"is_available": choice([True, True, False])}
                        )

                    # create combos per branch
                    branch_menu_sample = tenant_menus[:]
                    if len(branch_menu_sample) >= 3:
                        combo_count = min(3, len(branch_menu_sample) // 2)
                        for combo_index in range(combo_count):
                            combo_items = sample(branch_menu_sample, k=choice([2, 3]))
                            combo_price = sum(item.price for item in combo_items) * Decimal("0.85")
                            combo = Combo.objects.create(
                                tenant=tenant,
                                branch=branch,
                                name=f"{branch.address.split()[0]} Special {combo_index + 1}",
                                combo_price=combo_price,
                            )
                            for menu_item in combo_items:
                                ComboItem.objects.create(
                                    combo=combo,
                                    menu_item=menu_item,
                                    quantity=1,
                                )

                # create tenant level discounts and coupons
                tenant_discount = Discount.objects.create(
                    tenant=tenant,
                    name=f"{tenant.restaurant_name} Happy Hour",
                    description=faker.text(),
                    type=choice(['volume', 'combo', 'bogo', 'freeItem']),
                    priority=randint(1, 5),
                    is_stackable=choice([True, False]),
                )
                DiscountRule.objects.create(
                    tenant=tenant,
                    discount_id=tenant_discount,
                    min_items=choice([1, 2, 3]),
                    min_price=Decimal(randint(20, 60)),
                    applicable_items=[str(menu.id) for menu in sample(tenant_menus, k=min(len(tenant_menus), 3))],
                    excluded_items=[],
                )

                Coupon.objects.create(
                    tenant=tenant,
                    discount_code=f"{tenant.restaurant_name[:5].upper()}SAVE",
                    discount_amount=Decimal(randint(5, 15)),
                    is_percentage=False,
                )

                for branch in [b for b in branches if b.tenant == tenant]:
                    branch_discount = Discount.objects.create(
                        tenant=tenant,
                        name=f"{branch.address.split()[0]} Special",
                        description=faker.text(),
                        type=choice(['volume', 'combo', 'bogo', 'freeItem']),
                        priority=randint(1, 5),
                        is_stackable=choice([True, False]),
                    )
                    DiscountRule.objects.create(
                        tenant=tenant,
                        discount_id=branch_discount,
                        min_items=choice([1, 2]),
                        min_price=Decimal(randint(10, 40)),
                        applicable_items=[str(menu.id) for menu in sample(tenant_menus, k=min(len(tenant_menus), 2))],
                        excluded_items=[],
                    )

                    Coupon.objects.create(
                        tenant=tenant,
                        discount_code=f"{branch.address[:4].upper()}-{randint(100,999)}",
                        discount_amount=Decimal(randint(10, 25)),
                        is_percentage=True,
                    )

        # create customers
        customers = [demo_customer]
        for c in range(customer_count):
            customers.append(
                User.objects.create_user(
                    email=f'customer{c + 1}@example.com',
                    password='password',
                    full_name=faker.name(),
                    user_type='customer',
                )
            )

        # create orders
        for customer in customers:
            for _ in range(orders_per_customer):
                tenant = choice(tenants)
                branch_choices = [b for b in branches if b.tenant == tenant]
                branch = choice(branch_choices)
                table_choices = [t for t in tables if t.branch == branch]
                table = choice(table_choices)
                order = Order.objects.create(
                    tenant=tenant,
                    branch=branch,
                    table=table,
                    customer=customer,
                    status='placed'
                )
                # order items
                for _ in range(randint(1, 5)):
                    menu_choices = [m for m in menus if m.tenant == tenant]
                    menu_item = choice(menu_choices)
                    quantity = randint(1, 3)
                    OrderItem.objects.create(
                        order=order,
                        menu_item=menu_item,
                        quantity=quantity,
                        price=menu_item.price
                    )

        self.stdout.write(self.style.SUCCESS('Database seed completed.'))

    def _fake_image(self):
        """Create a simple in-memory image for ImageField."""
        img = Image.new('RGB', (100, 100), color=(randint(0, 255), randint(0, 255), randint(0, 255)))
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return ContentFile(buffer.getvalue(), 'seed.png')
