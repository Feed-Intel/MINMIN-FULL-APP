# MinMinBENode

This package provides a NestJS-based Node.js backend that mirrors the Django project's domain
modules in `MinMinBE/`. It is intended as the starting point for the migration away from Django
while keeping the existing Python codebase intact. The service now ships with production-ready
implementations for accounts, restaurants, customers, loyalty, feed, and push-notification domains
backed by PostgreSQL via TypeORM.

## Getting started

```bash
cd MinMinBENode
npm install
npm run start:dev
```

The development server boots on `http://localhost:3000/api` by default. Update the port or API
prefix via environment variables defined in `.env` (see below).

## Configuration

Configuration is loaded through `@nestjs/config` and split into two providers:

- `app.config.ts`: application name, environment, port, and API prefix.
- `database.config.ts`: TypeORM Postgres settings. These map closely to the existing Django
  database variables, so you can reuse the same `.env` entries (`DB_HOST`, `DB_PORT`, etc.).

Copy `.env.example` to `.env` and supply your secrets locally. Additional variables required by the
Node backend include `JWT_SECRET`, `JWT_REFRESH_SECRET`, `INTERNAL_API_KEY`, and SMTP credentials for
outbound email.

## Module structure

Each Django app has a corresponding NestJS module to ease the migration:

- `core`: health check endpoint.
- `accounts`: full authentication (registration with OTP, JWT login/refresh, password reset, admin
  user management) mapped to the existing `accounts_user` table.
- `customer`: CRUD for saved addresses with tenant-aware permissions mirroring the Django
  `customer.address` app.
- `restaurant`: tenant and branch management including default-branch semantics and geospatial
  coordinates.
- `feed`: social feed with posts, likes, bookmarks, comments, shares, and tag management.
- `loyalty`: customer and tenant loyalty ledgers plus transaction history aligned with Django's
  loyalty models.
- `push-notification`: persistent notification queue scoped to tenants.
- `ai`: placeholder for AI-specific workflows.

All modules expose controllers, services, DTOs, and TypeORM entities that target the same PostgreSQL
schema the Django project uses today, enabling the two stacks to coexist during migration.

## Background jobs & AI integrations

The NestJS project leaves room for background processing using BullMQ or other queue libraries. The
`AiModule` demonstrates how to wrap AI interactions behind a service that can proxy to Python
microservices if required.

## Coding standards

- TypeScript strict mode is enabled.
- ESLint and Prettier configurations mirror the frontend projects for consistency.
- DTOs use `class-validator` and `class-transformer` decorators for request validation.

## Next steps

1. Wire the NestJS services into the existing CI/CD workflow alongside Django.
2. Port remaining Django domain logic (orders, payments, feedback, etc.) into their respective
   modules following the established patterns.
3. Integrate background jobs for long-running tasks (image compression, notifications) and streaming
   updates.
4. Expand the `AiModule` to call existing ML services or Python runtimes.
