# Deployment Strategy — Single EC2, Docker Compose, Nginx

This document describes how to deploy the MinMin monorepo (Django API + two Expo web frontends) on a single EC2 instance with Nginx and Docker Compose. It targets an MVP scale of ~1k customers, ~100 restaurants, and 1–3k orders/day.

## Overview
- Reverse proxy: Nginx (container) on EC2; terminates HTTP (TLS can be terminated upstream by your provider or added later via Let’s Encrypt).
- Backend: Django (ASGI) in a container, behind Nginx.
- Data: Postgres/PostGIS and Redis in containers with persisted volumes.
- Frontend: Static web builds (Expo export) served by Nginx under separate vhosts.
- Optional workers: add Celery worker and beat containers if needed.

## Domains
Create DNS A-records to the EC2 public IP:
- `api.app.com` → API (proxied by Nginx to `api:8000`)
- `customer.app.com` → Customer web (Nginx serves static)
- `restaurant.app.com` → Restaurant web (Nginx serves static)

If your domain provider handles SSL at the edge and forwards HTTP to origin, no further origin TLS setup is required. Otherwise add Let’s Encrypt on the EC2 host later (out of scope for now).

## Repository Files
- Compose (prod): `deploy/docker-compose.prod.yml`
- Nginx:
  - `deploy/nginx/nginx.conf`
  - `deploy/nginx/conf.d/api.conf`
  - `deploy/nginx/conf.d/customer.conf`
  - `deploy/nginx/conf.d/restaurant.conf`
- CI/CD workflow: `.github/workflows/deploy-ec2.yml`

## Server Layout (on EC2)
- `/opt/minmin/docker-compose.prod.yml` — compose file (copied by CI)
- `/opt/minmin/nginx/` — nginx.conf and vhosts (copied by CI)
- `/opt/minmin/api.env` — Django environment (written by CI from GitHub Secrets)
- `/opt/minmin/deploy.env` — Compose env (e.g. `API_IMAGE=...`)
- `/opt/minmin/customer/` — static site for customer
- `/opt/minmin/restaurant/` — static site for restaurant
- Docker volumes:
  - `pgdata` for Postgres data
  - `media_data` for Django media (mounted to Nginx at `/media/`)

## Environment
Set the following in GitHub Secrets/Variables for the workflow:

Secrets (Repository → Settings → Secrets and variables → Actions):
- `EC2_HOST` — EC2 public IP or DNS
- `EC2_USER` — SSH user (e.g., `ubuntu`)
- `EC2_SSH_KEY` — private key for SSH (PEM)
- `EC2_SSH_PORT` — optional, default 22
- `GHCR_USERNAME` — your GitHub username or org name
- `GHCR_TOKEN` — a PAT with `read:packages` (used on server for `docker login`)
- `DJANGO_SECRET_KEY`
- `DATABASE_URL` — e.g., `postgis://minmin:<password>@db:5432/minmin`
- `REDIS_URL` — e.g., `redis://redis:6379/0`
- Optional: `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

Variables (Repository → Settings → Secrets and variables → Actions → Variables):
- `API_DOMAIN` — e.g., `api.app.com`
- `CUSTOMER_DOMAIN` — e.g., `customer.app.com`
- `RESTAURANT_DOMAIN` — e.g., `restaurant.app.com`

## CI/CD Flow
Workflow file: `.github/workflows/deploy-ec2.yml`

1) Build and push API image to GHCR
- Builds `MinMinBE` and pushes `ghcr.io/<owner>/minmin-api:latest` and `:sha`.

2) Build frontends (static web)
- `restaurantFE` and `customerFE` built via `npx expo export --platform web` with production URLs injected (derived from `API_DOMAIN` and each app domain).
- Artifacts are uploaded for the deploy job.

3) Deploy to EC2 over SSH
- Copies compose and Nginx configs to `/opt/minmin/`.
- Copies built static sites to `/opt/minmin/restaurant` and `/opt/minmin/customer`.
- Generates `/opt/minmin/api.env` with Django settings (from Secrets).
- Writes `/opt/minmin/deploy.env` with `API_IMAGE` pointing to GHCR.
- Logs into GHCR on the server and runs `docker compose up -d`.
- Health checks `http://localhost/healthz/` via Nginx.

## Nginx
- `api.conf`: proxies `/` and `/ws/` to the API container, serves `/media/`.
- `customer.conf` and `restaurant.conf`: serve static SPA builds with fallback to `index.html`.
- Nginx listens on port `80`. If terminating TLS locally later, add `listen 443 ssl;` and certificates to each server block.

## Scaling & Ops
- Instance: start with `t3.medium` (2 vCPU, 4 GB RAM); monitor CPU and memory.
- Data: keep Postgres/Redis local for MVP; move to RDS/ElastiCache when needed.
- Backups: schedule `pg_dump` to S3 and EBS snapshots periodically.
- Security: restrict SG to 22/80/443; keep `5432` and `6379` private.
- Logs/Monitoring: ship container logs to CloudWatch or a lightweight Loki stack.

## Local vs Prod
- Local dev uses `docker compose` in repo root, dev `.env`, and Expo dev servers.
- Prod uses `deploy/docker-compose.prod.yml`, GHCR image, Nginx, and static frontends.

## One-time Server Prep (manual)
SSH into EC2 and ensure:
```sh
sudo mkdir -p /opt/minmin && sudo chown -R $USER:$USER /opt/minmin
sudo apt-get update && sudo apt-get install -y curl
curl -fsSL https://get.docker.com | sh
``` 
The workflow will install the compose plugin if missing.

---

Questions or changes you want in this setup (e.g., add Celery, switch to RDS, add TLS on-box)? Create an issue and we can iterate.
