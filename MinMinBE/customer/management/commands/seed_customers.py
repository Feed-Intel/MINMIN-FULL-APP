from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from customer.address.models import Address
from customer.order.models import Order, OrderItem
from customer.feedback.models import Feedback
from customer.cart.models import Cart, CartItem
from loyalty.models import *
from feed.models import *
from restaurant.menu.models import Menu
from restaurant.tenant.models import Tenant
from restaurant.table.models import Table
from faker import Faker
import random
from django.utils import timezone

User = get_user_model()
fake = Faker()

class Command(BaseCommand):
    help = 'Seed additional customer data without deleting existing records'

    def handle(self, *args, **options):
        self.stdout.write("Creating additional customer data...")
        
        # Get or create customers
        customers = self._get_or_create_customers(10)
        self._create_addresses(customers, 3)
        self._update_loyalty_data(customers)
        self._create_carts(customers)
        orders = self._create_orders(customers, 5)  # 5 orders per user
        self._create_feedback(orders)
        self._create_customer_engagement(customers)  # Engagement with posts
        
        self.stdout.write(self.style.SUCCESS("Successfully added customer data!"))

    def _get_or_create_customers(self,count):
        fake = Faker()
        batch_size = 20

        # Generate unique emails manually
        email_set = set()
        while len(email_set) < count:
            email_set.add(fake.email())
        emails = list(email_set)

        # Find existing emails in the DB
        existing_emails = set(
            User.objects.filter(email__in=emails).values_list('email', flat=True)
        )

        # Create new users for emails not already in the DB
        new_users = []
        for email in emails:
            if email not in existing_emails:
                user = User(
                    email=email,
                    full_name=fake.name(),
                    user_type='customer',
                    phone=fake.numerify('+251########'),
                    is_active=True,
                    otp=None,
                    otp_expiry=None
                )
                user.set_password('customer123')
                new_users.append(user)

        # Batch create new users
        if new_users:
            User.objects.bulk_create(new_users, batch_size=batch_size)

        # Return all users (existing + new), sorted by input email order
        users = list(User.objects.filter(email__in=emails))
        users.sort(key=lambda u: emails.index(u.email))  # optional: keep original order
        return users

    def _update_loyalty_data(self, customers):
        # Update global settings
        for event in ['payment', 'order', 'feedback', 'profile']:
            GlobalLoyaltySettings.objects.update_or_create(
                event=event,
                defaults={'global_points': random.randint(10, 100)}
            )

        # Update restaurant loyalty settings
        for tenant in Tenant.objects.all():
            RestaurantLoyaltySettings.objects.update_or_create(
                tenant=tenant,
                defaults={'threshold': random.randint(100, 500)}
            )
            LoyaltyConversionRate.objects.update_or_create(
                tenant=tenant,
                defaults={'global_to_restaurant_rate': round(random.uniform(0.5, 2.0), 2)}
            )

        # Update customer loyalty points
        for user in customers:
            CustomerLoyalty.objects.update_or_create(
                customer=user,
                defaults={'global_points': random.randint(0, 1000)}
            )
            
            # Add tenant loyalty points
            for tenant in random.sample(list(Tenant.objects.all()), 3):
                TenantLoyalty.objects.update_or_create(
                    tenant=tenant,
                    customer=user,
                    defaults={'points': round(random.uniform(0, 500), 2)}
                )

    def _create_addresses(self, customers, per_user):
        for user in customers:
            for i in range(per_user):
                Address.objects.get_or_create(
                    user=user,
                    label=f'address_{i+1}',
                    defaults={
                        'address_line': fake.address(),
                        'gps_coordinates': f"{fake.latitude()},{fake.longitude()}",
                        'is_default': (i == 0)
                    }
                )

    def _create_carts(self, customers):
        tenants = Tenant.objects.all()
        for user in customers:
            tenant = random.choice(tenants)
            cart, created = Cart.objects.get_or_create(customer=user, tenant=tenant)
            
            # Only create cart items if tenant has menus
            menus = Menu.objects.filter(tenant=tenant)
            if created and menus.exists():
                for _ in range(random.randint(1, 5)):
                    menu = random.choice(menus)
                    CartItem.objects.get_or_create(
                        cart=cart,
                        menu_item=menu,
                        defaults={'quantity': random.randint(1, 3)}
                    )
            elif not menus.exists():
                self.stdout.write(self.style.WARNING(
                    f"Skipping cart items for {tenant.restaurant_name} - no menus found"
                ))

    def _create_orders(self, customers, per_user):
        orders = []
        tables = list(Table.objects.all())
        
        for user in customers:
            for _ in range(per_user):
                table = random.choice(tables)
                
                # Create new order with unique order_id
                order = Order.objects.create(
                    tenant=table.branch.tenant,
                    branch=table.branch,
                    table=table,
                    customer=user,
                    status=random.choice(['placed', 'progress', 'delivered'])
                )
                
                # Add order items
                menus = Menu.objects.filter(tenant=table.branch.tenant)
                if menus.exists():
                    for _ in range(random.randint(1, 5)):
                        menu = random.choice(menus)
                        OrderItem.objects.create(
                            order=order,
                            menu_item=menu,
                            quantity=random.randint(1, 3),
                            price=menu.price
                        )
                else:
                    self.stdout.write(self.style.WARNING(
                        f"No menus found for order in {table.branch.tenant.restaurant_name}"
                    ))
                
                orders.append(order)
        return orders

    def _create_feedback(self, orders):
        for order in orders:
            Feedback.objects.get_or_create(
                order=order,
                defaults={
                    'customer': order.customer,
                    'service_rating': random.randint(1, 5),
                    'food_rating': random.randint(1, 5),
                    'wait_rating': random.randint(1, 5),
                    'overall_rating': random.uniform(1, 5),
                    'comment': fake.paragraph()
                }
            )

    def _create_customer_engagement(self, customers):
        all_posts = Post.objects.all()
        
        for post in all_posts:
            # Likes
            likers = random.sample(
                customers, 
                random.randint(0, len(customers)//2)
            )
            post.likes.add(*likers)
            
            # Bookmarks
            bookmarks = random.sample(
                customers, 
                random.randint(0, len(customers)//4)
            )
            post.bookmarks.add(*bookmarks)
            
            # Comments
            for _ in range(random.randint(0, 50)):
                Comment.objects.create(
                    post=post,
                    user=random.choice(customers),
                    text=fake.sentence()
                )
            
            # Shares
            for _ in range(random.randint(0, 20)):
                Share.objects.create(
                    post=post,
                    user=random.choice(customers)
                )