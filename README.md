# MinMin Monorepo

This repository contains the MinMin backend API and two frontend applications.

## Local development

1. Adjust environment variables in `MinMinBE/.env` as needed.
2. Start the stack:
   ```bash
   make dev:up
   ```
3. The API will be available at <http://localhost:8000>.
   The customer frontend runs at <http://localhost:3000> and the restaurant frontend at <http://localhost:3001>.

## Deployment

### Backend – Elastic Beanstalk

Pushing to `develop` or `main` triggers `.github/workflows/deploy-backend-eb.yml` which:

1. Builds and pushes a Docker image to ECR.
2. Creates a new Elastic Beanstalk application version referencing the image.
3. Updates the target environment (`${EB_ENV_DEVELOP}` or `${EB_ENV_MAIN}`).
4. Performs a `/healthz` check.

### Frontend – AWS Amplify

Each frontend has its own Amplify Hosting app. Commits under `apps/restaurant-fe/` or `apps/customer-fe/` trigger builds via the Amplify API.

## Rollbacks

To rollback the backend, deploy a previous application version from the Elastic Beanstalk console or rerun the workflow with an older commit SHA.

Amplify retains build history per branch; redeploy a prior build from the Amplify console if needed.

## Environments

| Environment | Backend EB env      | Restaurant FE branch | Customer FE branch |
|-------------|--------------------|----------------------|--------------------|
| Develop     | `${EB_ENV_DEVELOP}` | `develop`            | `develop`          |
| Production  | `${EB_ENV_MAIN}`    | `main`               | `main`             |

## Make commands

- `make dev:up` – start local stack
- `make dev:down` – stop stack
- `make dev:logs` – tail API logs
- `make db:migrate` – run migrations
- `make db:seed` – seed data
