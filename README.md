# MinMin Monorepo

Django API with two React/Vite frontends. Backend runs on Elastic Beanstalk (multi-container Docker). Frontends deploy to AWS Amplify.

## Repository structure
```
MinMinBE/
customerFE/
restaurantFE/
db/init.sql
docker-compose.yml
Dockerrun.aws.json
.github/workflows/
amplify.customer.yml
amplify.restaurant.yml
```

## Backend environment variables
Set the following in Elastic Beanstalk (plain text):
```
DJANGO_SETTINGS_MODULE=minminbe.settings
DJANGO_SECRET_KEY=<generate>
DEBUG=false
ALLOWED_HOSTS=<your.domain>,127.0.0.1,localhost
CSRF_TRUSTED_ORIGINS=https://<your.domain>,https://<your-other-domain>
DATABASE_URL=postgresql://minmin:<password>@db:5432/minmin
REDIS_URL=redis://redis:6379/0
DJANGO_ALLOWED_CORS_ORIGINS=https://<your.domain>
```

### Django settings snippet
```python
import os
import dj_database_url

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")
CSRF_TRUSTED_ORIGINS = os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",")
DATABASES = {
    "default": dj_database_url.config(default=os.environ.get("DATABASE_URL"), conn_max_age=600)
}
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL"),
    }
}
```

## Step-by-step AWS setup
### Prereqs
1. Create ECR repository for the backend: `<ECR_BACKEND_URI>`
2. Create S3 bucket for EB app versions: `<EB_S3_BUCKET>`
3. Create Elastic Beanstalk application `<EB_APP>` and environment `<EB_ENV>` (Multi-container Docker on ECS)
4. Configure EB environment variables listed above
5. Create IAM role for GitHub OIDC with permissions:
   * ECR (push/pull)
   * S3 PutObject to `<EB_S3_BUCKET>`
   * Elastic Beanstalk (CreateApplicationVersion, UpdateEnvironment, Describe*)
   * CloudWatch Logs (optional)
   Trust policy: `token.actions.githubusercontent.com` with `sub: repo:<org>/<repo>:ref:refs/heads/*`
6. Create two Amplify apps:
   * customerFE – baseDirectory `customerFE`
   * restaurantFE – baseDirectory `restaurantFE`
   Set Amplify environment variables as needed and note each App ID

### CI/CD wiring
Add GitHub repository secrets/variables:
```
AWS_REGION
AWS_ROLE_TO_ASSUME
ECR_BACKEND
EB_APP
EB_ENV
EB_S3_BUCKET
AMPLIFY_APP_ID_CUSTOMER
AMPLIFY_APP_ID_RESTAURANT
AMPLIFY_BRANCH
```
Push to `develop` or `main` to trigger deployments.

### Local development
1. Create `MinMinBE/.env`
2. Start stack:
   ```bash
   docker compose up --build
   ```
3. API at http://localhost:8000, Postgres at localhost:5432, Redis at localhost:6379

### Notes
* `CSRF_TRUSTED_ORIGINS` must include scheme (`https://` or `http://`)
* Bundled Postgres/Redis inside Elastic Beanstalk are suitable for staging/dev. For production, use RDS and ElastiCache.
