# MinMinBENode

This package provides a NestJS-based Node.js backend that mirrors the Django project's domain
modules in `MinMinBE/`. It is intended as the starting point for the migration away from Django
while keeping the existing Python codebase intact.

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

Copy `.env.example` to `.env` and supply your secrets locally.

## Module structure

Each Django app has a corresponding NestJS module to ease the migration:

- `core`: health check endpoint.
- `accounts`: authentication and account management stubs.
- `customer`: customer profile stubs.
- `restaurant`: restaurant profile stubs.
- `feed`: menu/feed aggregation stubs.
- `loyalty`: loyalty points bookkeeping stubs.
- `push-notification`: push notification queueing stub.
- `ai`: placeholder for AI-specific workflows.

Each module exposes controllers, services, and DTOs that follow NestJS conventions. Replace the
in-memory implementations with real persistence and domain logic as functionality is migrated from
Django.

## Background jobs & AI integrations

The NestJS project leaves room for background processing using BullMQ or other queue libraries. The
`AiModule` demonstrates how to wrap AI interactions behind a service that can proxy to Python
microservices if required.

## Coding standards

- TypeScript strict mode is enabled.
- ESLint and Prettier configurations mirror the frontend projects for consistency.
- DTOs use `class-validator` and `class-transformer` decorators for request validation.

## Next steps

1. Implement real entities with TypeORM and map them to the PostgreSQL schema.
2. Port business logic from the Django services into the NestJS services.
3. Replace the stubbed in-memory stores with repository classes.
4. Integrate authentication (JWT/session) and background jobs.
5. Expand the `AiModule` to call existing ML services or Python runtimes.
