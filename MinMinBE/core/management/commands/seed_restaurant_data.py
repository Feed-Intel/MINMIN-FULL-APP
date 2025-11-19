from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from faker import Faker
from decimal import Decimal, ROUND_HALF_UP
from random import randint, choice, sample, random
import io
import math
from PIL import Image

from accounts.models import User
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table
from restaurant.menu.models import Menu
from feed.models import Post,Comment,Tag
from restaurant.menu_availability.models import MenuAvailability
from restaurant.combo.models import Combo, ComboItem
from restaurant.discount.models import Discount, DiscountRule, Coupon
from customer.order.models import Order, OrderItem
from customer.payment.models import Payment


DEFAULT_RESTAURANT_SEED_COUNTS = {
    "restaurants": 5,
    "branches": 3,
    "tables": 10,
    "menus": 20,
    "customers": 50,
    "orders": 5,
    "feed_posts_per_tenant": 5,
    "payments_per_order": 1,
}


class Command(BaseCommand):
    """Populate the database with realistic restaurant ordering data."""

    help = "Seed the database with restaurants, customers, menus and orders."

    def add_arguments(self, parser):
        parser.add_argument('--restaurants', type=int, default=DEFAULT_RESTAURANT_SEED_COUNTS["restaurants"], help='Number of restaurants to create')
        parser.add_argument('--branches', type=int, default=DEFAULT_RESTAURANT_SEED_COUNTS["branches"], help='Number of branches per restaurant')
        parser.add_argument('--tables', type=int, default=DEFAULT_RESTAURANT_SEED_COUNTS["tables"], help='Tables per branch')
        parser.add_argument('--menus', type=int, default=DEFAULT_RESTAURANT_SEED_COUNTS["menus"], help='Menu items per restaurant')
        parser.add_argument('--customers', type=int, default=DEFAULT_RESTAURANT_SEED_COUNTS["customers"], help='Number of customers to create')
        parser.add_argument('--orders', type=int, default=DEFAULT_RESTAURANT_SEED_COUNTS["orders"], help='Orders per customer')
        parser.add_argument(
            '--feed-posts-per-tenant',
            type=int,
            default=DEFAULT_RESTAURANT_SEED_COUNTS["feed_posts_per_tenant"],
            help='Feed posts to create per restaurant admin'
        )
        parser.add_argument(
            '--menu-availability-ratio',
            type=float,
            default=0.66,
            help='Probability (0-1) that a menu is available per branch'
        )
        parser.add_argument(
            '--payments-per-order',
            type=int,
            default=DEFAULT_RESTAURANT_SEED_COUNTS["payments_per_order"],
            help='Payments to attach to each seeded order (0 to skip)'
        )
        parser.add_argument(
            '--seed-size',
            type=float,
            default=1.0,
            help='Global multiplier applied to all per-entity counts (e.g. 2 doubles everything)'
        )
        parser.add_argument(
            '--only-posts',
            action='store_true',
            help='Seed only posts for existing tenant admins'
        )

    def handle(self, *args, **options):
        faker = Faker()

        seed_size = max(options.get('seed_size', 1.0), 0.1)

        def scaled(value, minimum=1):
            return max(minimum, int(math.ceil(value * seed_size)))

        restaurants = scaled(options['restaurants'])
        branches_per_restaurant = scaled(options['branches'])
        tables_per_branch = scaled(options['tables'])
        menus_per_restaurant = scaled(options['menus'])
        customer_count = scaled(options['customers'])
        orders_per_customer = scaled(options['orders'])
        only_posts = options['only_posts']
        feed_posts_per_tenant = max(0, int(math.ceil(options['feed_posts_per_tenant'] * seed_size)))
        menu_availability_ratio = min(max(options['menu_availability_ratio'], 0.0), 1.0)
        payments_per_order = max(0, int(math.ceil(options['payments_per_order'] * seed_size)))

        if only_posts:
            self._seed_posts_only(feed_posts_per_tenant)
            self.stdout.write(self.style.SUCCESS('✅ Seeded posts only.'))
            return


        self.stdout.write(self.style.WARNING('Starting database seed...'))

        tenants = []
        menus = []
        branches = []
        tables = []

        # create fixed accounts for admin and demo customer
        if not User.objects.filter(email='admin@example2.com').exists():
            User.objects.create_superuser(
                email='admin@example2.com',
                password='password',
                full_name='Admin User',
            )
        demo_customer = User.objects.filter(email='customer@example2.com').first()
        if not demo_customer:
            demo_customer = User.objects.create_user(
                email='customer@example2.com',
                password='password',
                full_name='Demo Customer',
                user_type='customer',
            )

        # create restaurants and related data
        for r in range(restaurants):
            with transaction.atomic():
                admin = User.objects.create_user(
                    email=f'restaurant{r + 1}@example2.com',
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
                            defaults={"is_available": random() < menu_availability_ratio}
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
                post_count = feed_posts_per_tenant
                for _ in range(post_count):
                    post = Post.objects.create(
                        user=admin,
                        image=self._fake_image(),
                        caption=faker.sentence(nb_words=randint(10, 20)),
                        location=faker.city(),
                        share_count=randint(0, 30)
                    )
                    tag_names = ['food', 'drink', 'dessert', 'offer', 'event', 'chef_special']
                    existing_tags = list(Tag.objects.all())
                    if not existing_tags:
                        for name in tag_names:
                            Tag.objects.create(name=name)
                        existing_tags = list(Tag.objects.all())

                    selected_tags = sample(existing_tags, k=randint(1, 3))
                    post.tags.add(*selected_tags)
                    if User.objects.filter(user_type='customer').exists():
                        customer_users = list(User.objects.filter(user_type='customer'))
                        liked_users = sample(customer_users, k=randint(0, min(10, len(customer_users))))
                        bookmarked_users = sample(customer_users, k=randint(0, min(5, len(customer_users))))
                        post.likes.add(*liked_users)
                        post.bookmarks.add(*bookmarked_users)

                    for _ in range(randint(0, 5)):
                        commenter = choice(customer_users) if customer_users else admin
                        Comment.objects.create(
                            post=post,
                            user=commenter,
                            text=faker.sentence(nb_words=randint(6, 15))
                        )

        # create customers
        customers = [demo_customer]
        for c in range(customer_count):
            customers.append(
                User.objects.create_user(
                    email=f'customer{c + 1}@example2.com',
                    password='password',
                    full_name=faker.name(),
                    user_type='customer',
                )
            )

        # create orders
        order_counter = 0
        payment_counter = 0
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
                order_counter += 1
                # order items
                order_total = Decimal("0.00")
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
                    order_total += menu_item.price * quantity

                if payments_per_order and order_total > 0:
                    base_amount = (order_total / payments_per_order).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    remaining_amount = order_total
                    method_choices = [method for method, _ in Payment.PAYMENT_METHOD_CHOICES]
                    status_choices = [status for status, _ in Payment.PAYMENT_STATUS_CHOICES]
                    for payment_index in range(1, payments_per_order + 1):
                        payments_left = payments_per_order - payment_index + 1
                        if payments_left == 1:
                            amount = remaining_amount
                        else:
                            amount = min(remaining_amount, base_amount)
                        remaining_amount -= amount
                        Payment.objects.create(
                            order=order,
                            payment_method=choice(method_choices),
                            payment_status=choice(status_choices),
                            transaction_id=f"SEED-{order.id}-{payment_index}-{randint(1000,9999)}",
                            amount_paid=amount
                        )
                        payment_counter += 1

        expected_branches = restaurants * branches_per_restaurant
        expected_tables = expected_branches * tables_per_branch
        expected_menus = restaurants * menus_per_restaurant
        summary_parts = [
            f"restaurants={len(tenants)}",
            f"branches={len(branches)} (expected {expected_branches})",
            f"tables={len(tables)} (expected {expected_tables})",
            f"menus={len(menus)} (expected {expected_menus})",
            f"customers={len(customers)}",
            f"orders={order_counter}",
            f"payments={payment_counter}",
        ]
        self.stdout.write(self.style.NOTICE("Seed summary: " + ", ".join(summary_parts)))
        if len(branches) != expected_branches or len(tables) != expected_tables or len(menus) != expected_menus:
            self.stdout.write(self.style.WARNING("Counts mismatch detected; please review configuration."))

        self.stdout.write(self.style.SUCCESS('Database seed completed.'))

    def _fake_image(self):
        """Create a simple in-memory image for ImageField."""
        img = Image.new('RGB', (100, 100), color=(randint(0, 255), randint(0, 255), randint(0, 255)))
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return ContentFile(buffer.getvalue(), 'seed.png')
    
    def _seed_posts_only(self, feed_posts_per_tenant=5):
        faker = Faker()

        tenants = Tenant.objects.select_related('admin').all()
        if not tenants.exists():
            self.stdout.write(self.style.ERROR("No tenants found. Please seed tenants first."))
            return

        # Ensure tags exist
        tag_names = ['food', 'drink', 'dessert', 'offer', 'event', 'chef_special']
        existing_tags = list(Tag.objects.all())
        if not existing_tags:
            for name in tag_names:
                Tag.objects.create(name=name)
            existing_tags = list(Tag.objects.all())

        customers = list(User.objects.filter(user_type='customer'))
        tags = list(Tag.objects.all())

        total_posts = 0
        for tenant in tenants:
            admin = tenant.admin
            post_count = max(0, feed_posts_per_tenant)

            for _ in range(post_count):
                post = Post.objects.create(
                    user=admin,
                    image=self._fake_image(),
                    caption=faker.sentence(nb_words=randint(10, 20)),
                    location=faker.city(),
                    share_count=randint(0, 30)
                )

                # Assign tags, likes, bookmarks, comments
                # selected_tags = sample(tags, k=randint(1, 3))
                # post.tags.add(*selected_tags)

                if customers:
                    liked_users = sample(customers, k=randint(0, min(10, len(customers))))
                    bookmarked_users = sample(customers, k=randint(0, min(5, len(customers))))
                    post.likes.add(*liked_users)
                    post.bookmarks.add(*bookmarked_users)

                    for _ in range(randint(0, 5)):
                        commenter = choice(customers)
                        Comment.objects.create(
                            post=post,
                            user=commenter,
                            text=faker.sentence(nb_words=randint(6, 15))
                        )

            total_posts += post_count
            self.stdout.write(self.style.NOTICE(f"Seeded {post_count} posts for {tenant.restaurant_name}"))

        self.stdout.write(self.style.SUCCESS(f"✅ Done! Created {total_posts} posts total."))
