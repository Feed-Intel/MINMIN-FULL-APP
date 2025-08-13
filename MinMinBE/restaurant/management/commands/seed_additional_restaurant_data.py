from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from restaurant.tenant.models import Tenant
from restaurant.branch.models import Branch
from restaurant.table.models import Table
from restaurant.menu.models import Menu
from restaurant.combo.models import Combo, ComboItem
from restaurant.related_menu.models import RelatedMenuItem
from restaurant.menu_availability.models import MenuAvailability
from feed.models import Post
from faker import Faker
from PIL import Image
import random
import os
import uuid
import requests
import io
from alpha import settings

User = get_user_model()
fake = Faker()

class Command(BaseCommand):
    help = 'Seed additional restaurant data without deleting existing records'
    def handle(self, *args, **options):
        self.stdout.write("Creating additional restaurant data...")
        
        tenants = self._create_tenants(5)  # Add 5 new tenants
        branches = self._create_branches(tenants, 2)  # 2 branches per tenant
        self._create_tables(branches, 5)  # 5 tables per branch
        menus = self._create_menus(tenants, 20)  # 20 menus per tenant
        self._create_combos(branches, menus, 3)  # 3 combos per branch
        self._create_related_items(menus)
        self._create_menu_availability(branches, menus)
        self._create_restaurant_posts(tenants)  # Create posts for each tenant
        self._update_tenant_keys()

        self.stdout.write(self.style.SUCCESS("Successfully added restaurant data!"))

    def _create_tenants(self, count):
        tenants = []
        for _ in range(count):
            restaurant_name = f"{fake.company()} {fake.unique.bothify('??##')}"
            admin_email = f"{fake.user_name()}{random.randint(1000,9999)}@example.com"
            chapa_api_key = 'CHASECK_TEST-ZThlLiDtxtdehIBITsREdlNoRkJjOCe2'
            chapa_public_key = 'CHAPUBK_TEST-mabNvvYP5uoUnXMlE8utNgkOPFkMtomY'

            try:
                admin_user = User.objects.get(email=admin_email)
                tenant, created = Tenant.objects.get_or_create(
                    restaurant_name=restaurant_name,
                    defaults={
                        'admin': admin_user,
                        'profile': fake.text(),
                        'tax': round(random.uniform(0, 0.2), 2),
                        'service_charge': round(random.uniform(0, 0.15), 2),
                        'max_discount_limit': random.randint(10, 50),
                        'CHAPA_API_KEY': chapa_api_key,
                        'CHAPA_PUBLIC_KEY': chapa_public_key
                    }
                )
                if not created:
                    # Check and update keys for existing tenant
                    update_needed = False
                    if not tenant.CHAPA_API_KEY:
                        tenant.CHAPA_API_KEY = chapa_api_key
                        update_needed = True
                    if not tenant.CHAPA_PUBLIC_KEY:
                        tenant.CHAPA_PUBLIC_KEY = chapa_public_key
                        update_needed = True
                    if update_needed:
                        tenant.save()
            except User.DoesNotExist:
                admin_user = User.objects.create_user(
                    email=admin_email,
                    password='tenantadmin123',
                    full_name=fake.name(),
                    user_type='restaurant',
                    is_active=True
                )
                tenant = Tenant.objects.create(
                    restaurant_name=restaurant_name,
                    admin=admin_user,
                    profile=fake.text(),
                    tax=round(random.uniform(0, 0.2), 2),
                    service_charge=round(random.uniform(0, 0.15), 2),
                    max_discount_limit=random.randint(10, 50),
                    CHAPA_API_KEY=chapa_api_key,
                    CHAPA_PUBLIC_KEY=chapa_public_key
                )
            tenants.append(tenant)
        return tenants
    
    def _update_tenant_keys(self):
        updated_count = 0
        chapa_api_key = 'CHASECK_TEST-ZThlLiDtxtdehIBITsREdlNoRkJjOCe2'
        chapa_public_key = 'CHAPUBK_TEST-mabNvvYP5uoUnXMlE8utNgkOPFkMtomY'
        for tenant in Tenant.objects.all():
            update_needed = False
            if not tenant.CHAPA_API_KEY:
                tenant.CHAPA_API_KEY = chapa_api_key
                update_needed = True
            if not tenant.CHAPA_PUBLIC_KEY:
                tenant.CHAPA_PUBLIC_KEY = chapa_public_key
                update_needed = True
            if update_needed:
                tenant.save()
                updated_count += 1
        self.stdout.write(f"Updated {updated_count} tenants with missing API keys.")

    def _create_branches(self, tenants, per_tenant):
        branches = []
        for tenant in tenants:
            for _ in range(per_tenant):
                branch, created = Branch.objects.get_or_create(
                    tenant=tenant,
                    address=fake.unique.street_address(),
                    defaults={
                        'location': Point(float(fake.longitude()), float(fake.latitude()), srid=4326),
                        'is_default': False
                    }
                )
                branches.append(branch)
        return branches

    def _create_tables(self, branches, per_branch):
        for branch in branches:
            for _ in range(per_branch):
                Table.objects.get_or_create(
                    branch=branch,
                    table_code=fake.unique.bothify('TBL-#####'),
                    defaults={
                        'is_fast_table': fake.boolean(),
                        'is_delivery_table': fake.boolean(),
                        'is_inside_table': fake.boolean()
                    }
                )

    def _generate_image(self, tenant, subfolder):
        """Download and save actual food-related images from Lorem Picsum"""
        # List of known food-related image IDs from Lorem Picsum
        food_image_ids = [
            312,  # Pizza
            430,  # Burger
            49,   # Pasta
            488,  # Sushi
            24,   # Steak
            163,  # Breakfast
            141,  # Coffee
            292,  # Salad
            259,  # Dessert
            429,  # Cocktail
            145,  # Seafood
            216   # Asian food
        ]

        try:
            # Download image
            image_id = random.choice(food_image_ids)
            url = f"https://picsum.photos/id/{image_id}/1080/1080.jpg"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Create directory structure
            dir_name = os.path.join('images', subfolder, str(tenant.id))
            os.makedirs(os.path.join(settings.MEDIA_ROOT, dir_name), exist_ok=True)
            
            # Process image with Pillow
            with Image.open(io.BytesIO(response.content)) as img:
                # Convert to RGB if needed (remove alpha channel)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Create in-memory buffer for processed image
                output = io.BytesIO()
                
                # Save as optimized WebP
                img.save(
                    output, 
                    format='WEBP',
                    quality=70,          # Quality setting (0-100)
                    method=6,            # Best compression
                    lossless=False       # Lossy compression for smaller size
                )
                output.seek(0)
                
                # Generate filename with webp extension
                filename = f"{uuid.uuid4().hex}.webp"
                file_path = os.path.join(dir_name, filename)
                full_path = os.path.join(settings.MEDIA_ROOT, file_path)
                
                # Save processed image
                with open(full_path, 'wb') as f:
                    f.write(output.getvalue())
                
                return file_path
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error processing image: {e}"))
            return "images/default-food.webp"

    def _create_menus(self, tenants, per_tenant):
        menus = []
        categories = ['Appetizer', 'Main Course', 'Dessert', 'Beverage']
        for tenant in tenants:
            for _ in range(per_tenant):
                # Generate image for menu item
                image_path = self._generate_image(tenant, 'menus')
                
                menu, created = Menu.objects.get_or_create(
                    name=fake.unique.word().title(),
                    tenant=tenant,
                    defaults={
                        'description': fake.sentence(),
                        'tags': [fake.word() for _ in range(3)],
                        'category': random.choice(categories),
                        'price': round(random.uniform(5, 100), 2),
                        'is_side': fake.boolean(),
                        'image': image_path  # Add generated image path
                    }
                )
                menus.append(menu)
        return menus

    def _create_combos(self, branches, menus, per_branch):
        for branch in branches:
            tenant_menus = [m for m in menus if m.tenant == branch.tenant]
            for _ in range(per_branch):
                combo, created = Combo.objects.get_or_create(
                    name=f"Combo {fake.unique.word().title()}",
                    tenant=branch.tenant,
                    branch=branch,
                    defaults={
                        'is_custom': fake.boolean(),
                        'combo_price': round(random.uniform(20, 100), 2)
                    }
                )
                if created and tenant_menus:
                    for _ in range(random.randint(3, 5)):
                        menu = random.choice(tenant_menus)
                        ComboItem.objects.get_or_create(
                            combo=combo,
                            menu_item=menu,
                            defaults={
                                'quantity': random.randint(1, 3),
                                'is_half': fake.boolean()
                            }
                        )

    def _create_related_items(self, menus):
        tags = ['Best Paired With', 'Alternative', 'Customer Favorite']
        for menu in menus:
            same_tenant_menus = Menu.objects.filter(
                tenant=menu.tenant
            ).exclude(id=menu.id)
            
            if same_tenant_menus.exists():
                for related_menu in random.sample(list(same_tenant_menus), 2):
                    RelatedMenuItem.objects.get_or_create(
                        tenant=menu.tenant,
                        menu_item=menu,
                        related_item=related_menu,
                        defaults={'tag': random.choice(tags)}
                    )
    
    def _create_menu_availability(self, branches, menus):
        for branch in branches:
            branch_menus = [m for m in menus if m.tenant == branch.tenant]
            for menu in branch_menus:
                MenuAvailability.objects.get_or_create(
                    branch=branch,
                    menu_item=menu,
                    defaults={
                        'is_available': fake.boolean(chance_of_getting_true=80),
                        'special_notes': fake.sentence() if fake.boolean() else None
                    }
                )

    def _create_restaurant_posts(self, tenants):
        for tenant in tenants:
            admin_user = tenant.admin
            restaurant_name = tenant.restaurant_name

            food_tags = [
                self._get_or_create_tag(name)
                for name in [
                    'Special Offer',
                    'New Menu',
                    fake.text(max_nb_chars=20).strip(),
                    random.choice([
                        'Italian Cuisine',
                        'Asian Fusion',
                        'Vegetarian Specials',
                        'Seasonal Menu'
                    ]),
                    fake.word(ext_word_list=['Pizza', 'Pasta', 'Burger', 'Sushi'])
                ]
            ]
            food_tags += [
                self._get_or_create_tag(fake.word(ext_word_list=[
                    'Organic', 'Gluten-Free', 'Vegan', 'Farm-to-Table'
                ]))
            ]

            for _ in range(random.randint(5, 10)):
                # Generate post image
                post_image_path = self._generate_image(tenant, 'posts')
                
                post = Post.objects.create(
                    user=admin_user,
                    image=post_image_path,
                    caption=f"{restaurant_name} - {fake.catch_phrase()}",
                    location=restaurant_name,
                )
                
                post.tags.add(*random.sample(food_tags, 3))
                post.meta_data = {
                    'promotion_type': random.choice([
                        'new_menu', 
                        'special_offer',
                        'event',
                        'announcement'
                    ]),
                    'valid_until': fake.future_datetime(end_date='+30d').isoformat()
                }
                post.save()

    def _get_or_create_tag(self, name):
        from feed.models import Tag
        tag, _ = Tag.objects.get_or_create(name=name.strip().title())
        return tag