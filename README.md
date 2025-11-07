# MinMin Monorepo

Django API with two Expo web frontends. Run locally with Docker Compose; deploy staging to a single EC2 instance via GitHub Actions + Docker Compose.

## Repository structure
```
MinMinBE/                 # Django backend (ASGI)
customerFE/               # Customer Expo app (web export)
restaurantFE/             # Restaurant Expo app (web export)
db/init.sql               # PostGIS init (CREATE EXTENSION postgis)
docker-compose.yml        # Local dev: db, redis, api (+ optional web dev servers)
deploy/                   # Production compose and Nginx configs
  ├─ docker-compose.prod.yml
  └─ nginx/
.github/workflows/        # CI/CD (deploy-ec2.yml)
```

## Key environment variables
Backend (local `.env` and staging `/opt/minmin/api.env`):
```
DJANGO_SETTINGS_MODULE=minminbe.settings
DJANGO_SECRET_KEY=<generate>
DEBUG=false
ALLOWED_HOSTS=<your.domain>,127.0.0.1,localhost
CSRF_TRUSTED_ORIGINS=https://<your.domain>
DATABASE_URL=postgis://minmin:<password>@db:5432/minmin
REDIS_URL=redis://redis:6379/0
DJANGO_ALLOWED_CORS_ORIGINS=https://<frontend.domain>
```

### Local development
1. Create `MinMinBE/.env`
2. Start stack:
   ```bash
   docker compose up --build
   ```
3. API at http://localhost:8000, Postgres at localhost:5432, Redis at localhost:6379

### Admin / Superuser
- Create an admin account (running inside the `api` container):
  - Interactive:
    ```bash
    docker compose exec api python manage.py createsuperuser --email admin@example.com
    ```
  - Non‑interactive:
    ```bash
    docker compose exec \
      -e DJANGO_SUPERUSER_EMAIL=admin@example.com \
      -e DJANGO_SUPERUSER_PASSWORD='<strong-password>' \
      -e DJANGO_SUPERUSER_NAME='Admin' \
      api python manage.py createsuperuser --noinput
    ```
- Admin URL: `http://localhost:8000/admin/`

### Frontends (local web)
- Restaurant web (Expo): http://localhost:19007
- Customer web (Expo): http://localhost:19006
- If you run via compose services added in `docker-compose.yml`, the API URLs are prewired to `http://localhost:8000`.

### Seed sample data
- Bring the stack up first (db + redis + api running).
- Seed everything (restaurants + customers):
  ```bash
  make db:seed
  # or
  docker compose exec api python manage.py seed_full
  ```
- Need a heavier dataset for performance testing? Pass the override flags through `seed_full`:
  ```bash
  docker compose exec api python manage.py seed_full \
    --seed-size 3 \
    --restaurants 15 \
    --restaurant-branches 4 \
    --restaurant-tables 25 \
    --restaurant-menus 60 \
    --restaurant-customers 200 \
    --restaurant-orders 8 \
    --feed-posts-per-tenant 10 \
    --menu-availability-ratio 0.9 \
    --payments-per-order 2 \
    --customer-count 500 \
    --addresses-per-customer 5 \
    --orders-per-customer 15
  ```
- Restaurant overrides mirror the knobs exposed by `seed_restaurant_data` (restaurants, branches, tables, menus, attached customers/orders, feed posts, menu availability ratio, and payments per order); customer overrides feed directly into `seed_customers`.
- Use `--seed-size <multiplier>` by itself to uniformly scale every default count (restaurants, tables, menus, customers, orders, posts, payments, etc.) without having to pass the individual flags.
- Seed only restaurants (heavier; downloads images, needs network):
  ```bash
  make db:seed:restaurants
  # or
  docker compose exec api python manage.py seed_full --no-customers
  ```
- Seed only customers:
  ```bash
  make db:seed:customers
  # or
  docker compose exec api python manage.py seed_full --no-restaurants
  ```
- Notes:
  - The seeding command temporarily disables outbound emails and websocket broadcasting.
  - Restaurant seeding generates and downloads images; this can take time and memory.
  - Seeding is idempotent-ish: it adds data without deleting existing records.

---

## Single‑EC2 Staging Deployment (CI/CD)

This repo includes a GitHub Actions workflow that deploys the full stack (API + Nginx + static frontends) to a single EC2 instance with Docker Compose:

- Workflow: `.github/workflows/deploy-ec2.yml`
- Compose: `deploy/docker-compose.prod.yml`
- Nginx config: `deploy/nginx/`

### Required GitHub settings
- Secrets:
  - `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`
  - `GHCR_USERNAME`, `GHCR_TOKEN` (PAT with `read:packages`)
  - `DJANGO_SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`
  - Optional: `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- Variables:
  - `API_DOMAIN` (e.g., `stg.api.feed-intel.com`)
  - `CUSTOMER_DOMAIN` (e.g., `stg.customer.feed-intel.com`)
  - `RESTAURANT_DOMAIN` (e.g., `stg.restaurant.feed-intel.com`)

### What the workflow does
- Builds and pushes the API image to GHCR.
- Builds both frontends as static sites with production URLs baked in.
- Copies Compose + Nginx + static artifacts to `/opt/minmin/` on EC2.
- Writes `/opt/minmin/api.env` (Django env) and `/opt/minmin/deploy.env` (API image tag).
- Restarts Nginx and brings up the full stack via `docker compose`.
- Health checks `http://localhost/healthz/` through Nginx using the proper Host header.

### Domains and routing
- DNS A records should point staging subdomains to the EC2 public IP:
  - `stg.api.feed-intel.com`, `stg.customer.feed-intel.com`, `stg.restaurant.feed-intel.com`
- Nginx vhosts are templated and patched by the workflow to use those domains.
- API root `/` redirects to `/docs`. Health endpoint is `/healthz/`.

### HTTPS
- Out of the box, Nginx listens on port 80 (HTTP). To enable HTTPS either:
  - Add Let’s Encrypt to the EC2 instance and 443 server blocks, or
  - Front with a proxy/CDN (e.g., Cloudflare) and use an origin cert.

### Staging superuser (on EC2)
```bash
sudo docker compose -f /opt/minmin/docker-compose.prod.yml exec api \
  python manage.py createsuperuser --email admin@feed-intel.com
```
Admin URL: `http://stg.api.feed-intel.com/admin/`

### Notes
- `CSRF_TRUSTED_ORIGINS` must include scheme (`https://` or `http://`).
- For production hardening, consider RDS (Postgres) and ElastiCache (Redis), HTTPS on EC2 or via a proxy, and restricting SSH.
