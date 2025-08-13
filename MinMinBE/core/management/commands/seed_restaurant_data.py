from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.db import transaction
from faker import Faker
from decimal import Decimal
from random import randint, choice
import io
from PIL import Image

from accounts.models import User
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table
from restaurant.menu.models import Menu
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
                        table = Table.objects.create(branch=branch)
                        tables.append(table)

                # create menus
                for _ in range(menus_per_restaurant):
                    menu = Menu.objects.create(
                        tenant=tenant,
                        name=faker.word().title() + ' ' + choice(['Burger', 'Pizza', 'Salad', 'Pasta', 'Soup']),
                        description=faker.paragraph(),
                        price=Decimal(randint(5, 40)),
                        category=choice(['Main', 'Drink', 'Dessert']),
                        tags=[faker.word() for _ in range(3)],
                        image=self._fake_image()
                    )
                    menus.append(menu)

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
