# Amplify Apps

Two Amplify Hosting apps are used for the frontends.

## Restaurant Frontend
- App ID: `${AMPLIFY_APP_ID_RESTAURANT}`
- Branches: `develop` (dev), `main` (prod)
- Build root: `apps/restaurant-fe`

## Customer Frontend
- App ID: `${AMPLIFY_APP_ID_CUSTOMER}`
- Branches: `develop` (dev), `main` (prod)
- Build root: `apps/customer-fe`

Environment variables are defined per app in the Amplify console. Build-time variables are configured under App settings → Environment variables, while runtime variables can be injected using [Amplify's hosted UI rewrites](https://docs.aws.amazon.com/amplify/latest/userguide/env-var.html).
