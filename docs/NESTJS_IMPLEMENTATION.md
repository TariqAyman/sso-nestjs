# NESTJS_IMPLEMENTATION.md

This document provides an overview of the NestJS Open SSO implementation.

## Project Structure

- **src/**: Main source code
  - `auth/`: Authentication logic (controllers, services, strategies)
  - `oauth/`: OAuth provider integration
  - `sso/`: SSO logic and controllers
  - `common/`: Shared modules and services
  - `user/`, `users/`: User management
  - `webhook/`: Webhook handling
  - `tasks/`: Scheduled/background tasks
- **prisma/**: Database schema and migrations
- **scripts/**: Utility scripts (e.g., database setup)

## Key Features

- Modular architecture using NestJS modules
- Authentication via JWT, OAuth, and local strategies
- SSO endpoints for federated login
- Prisma ORM for database access
- Webhook support for external integrations
- Task scheduling for retries and cleanup

## Getting Started

1. Install dependencies: `npm install`
2. Configure environment: Copy `.env.example` to `.env` and update values
3. Run migrations: `npx prisma migrate dev`
4. Start the server: `npm run start:dev`

## Useful Commands

- Run tests: `npm test`
- Generate migration: `npx prisma migrate dev --name <name>`
- Seed database: `npx prisma db seed`

---
