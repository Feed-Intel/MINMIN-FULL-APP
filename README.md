# MinMin Full App

MinMin is a full-stack platform for restaurant ordering and management. The backend is a Django project and exposes APIs for accounts, restaurant menus, orders, loyalty programs and push notifications. Two Expo/React Native mobile apps serve customers and restaurant staff.

## Repository structure
- **MinMin BE** – Django backend for accounts, restaurant management, ordering, loyalty, feeds and notifications.
- **MinMin FE Customer** – Expo app for customers to browse menus, manage carts and place orders.
- **MinMin FE Restaurant** – Expo app for restaurant staff to manage menus, orders and analytics.

## Prerequisites
- Python 3
- Node.js and npm
- PostgreSQL with PostGIS
- Redis (for Channels and Celery)
- Expo CLI / Expo Go or Android/iOS emulators for mobile testing

## Backend setup
1. Change into the backend folder:
   ```bash
   cd "MinMin BE"
   ```
2. Create and activate a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Provide required environment variables such as `SECRET_KEY`, database credentials (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`) and any email/OAuth keys referenced in `alpha/settings.py`.
4. Apply migrations, initialize an admin user, and start the development server:
   ```bash
   python manage.py migrate
   python init_admin_user.py
   python manage.py runserver
   ```
5. Optional services:
   ```bash
   celery -A alpha worker -l info
   celery -A alpha beat -l info
   ```

### Generate stress-test data

The backend includes a management command for populating the database with a
large volume of realistic restaurant data.  This is useful for QA or load
testing.

Run the command from the backend directory and adjust the numbers to suit your
needs:

```bash
python manage.py seed_restaurant_data --restaurants 50 --customers 1000 --orders 20
```

By default the command creates sample images and thousands of related records
for restaurants, branches, tables, menus, customers and orders.  Use higher
numbers to perform heavy stress tests.

The seeding process also provisions convenient QA logins:

- **Admin:** `admin@example.com` / `password`
- **Demo customer:** `customer@example.com` / `password`

## Customer app
1. Install dependencies:
   ```bash
   cd "MinMin FE Customer"
   npm install
   ```
2. Start the app:
   ```bash
   npx expo start
   ```

## Restaurant app
1. Install dependencies:
   ```bash
   cd "MinMin FE Restaurant"
   npm install
   ```
2. Start the app:
   ```bash
   npx expo start
   ```

## Features
- Restaurants manage branches, menus, combos, discounts and tables while customers place orders, give feedback and make payments.
- The backend uses Django, Django REST Framework, Celery and Channels for real-time features and scheduled tasks.
- Frontend apps are built with Expo and React Native, supporting Android, iOS and web.

