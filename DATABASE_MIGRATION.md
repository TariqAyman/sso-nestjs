# DATABASE_MIGRATION.md

This document describes how to manage database migrations in the NestJS Open SSO project.

## Tools Used

- **Prisma**: Used for database schema management and migrations.

## Migration Workflow

1. **Modify the Prisma schema**
   - Edit `prisma/schema.prisma` to update your models.
2. **Generate a migration**
   - Run: `npx prisma migrate dev --name <migration_name>`
   - This creates a new migration in `prisma/migrations/`.
3. **Apply migrations**
   - Migrations are automatically applied in development with the above command.
   - For production, use: `npx prisma migrate deploy`
4. **Seed the database**
   - Run: `npx prisma db seed`
   - Seeds are defined in `prisma/seed.ts`.

## Rollback Migrations

- Use: `npx prisma migrate resolve --rolled-back <migration_name>`

## Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---
