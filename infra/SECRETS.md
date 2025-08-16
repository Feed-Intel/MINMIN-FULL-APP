# Secrets and Parameters

GitHub repository secrets required:

- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION`
- `ECR_BACKEND`
- `ECR repository name` – `minmin-backend` (must exist or be created)
- `EB_APP`
- `EB_ENV_MAIN`
- `EB_ENV_DEVELOP`
- `AMPLIFY_APP_ID_RESTAURANT`
- `AMPLIFY_BRANCH_RESTAURANT`
- `AMPLIFY_APP_ID_CUSTOMER`
- `AMPLIFY_BRANCH_CUSTOMER`

AWS Secrets Manager:

- `/minmin/backend/production` – JSON object containing `DATABASE_URL`, `SECRET_KEY`, etc.

SSM Parameter Store:

- `/minmin/backend/EXAMPLE_PARAM` – non-sensitive configuration values.
