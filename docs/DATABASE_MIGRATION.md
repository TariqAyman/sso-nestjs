# Database Migration Guide

This document describes how to manage database migrations in the NestJS Open SSO project.

## Current Database Status

- **Database Provider**: MySQL
- **ORM**: Prisma 6.15.0
- **Current Migration**: `20250831093255_init` (Fresh database setup)
- **Schema Location**: `prisma/schema/schema.prisma` (Split schema architecture)

## Tools Used

- **Prisma**: Used for database schema management and migrations
- **MySQL**: Primary database for production and development

## Migration Workflow

### 1. Modify the Prisma Schema

The schema is split into logical modules for better organization:

```bash
prisma/schema/
├── schema.prisma          # Main schema file (generator, datasource)
├── organizations.prisma   # Organization management
├── sso-applications.prisma # SSO app configuration
├── users.prisma          # User management & authentication
├── oauth.prisma          # OAuth flows and tokens
├── permissions.prisma    # RBAC permissions and roles
├── menus.prisma          # Navigation system
├── jobs.prisma           # Background job processing
├── saml.prisma           # SAML enterprise features
└── webhooks.prisma       # Webhook delivery tracking
```

**Important**: Edit the individual module files but remember that Prisma uses `prisma/schema/schema.prisma` as the main file.

### 2. Generate a Migration

```bash
# Navigate to the project root
cd nestjs-open-sso

# Generate a new migration
npx prisma migrate dev --name <descriptive_migration_name>

# Example:
npx prisma migrate dev --name add_user_preferences
```

This command:

- Creates a new migration in `prisma/schema/migrations/`
- Applies the migration to your development database
- Regenerates the Prisma client

### 3. Apply Migrations

**Development:**

```bash
npx prisma migrate dev
```

**Production:**

```bash
npx prisma migrate deploy
```

### 4. Seed the Database

```bash
# Run the seed script (configured in package.json)
npx prisma db seed

# Or run directly
npm run prisma:seed
```

Seeds are defined in `prisma/seed.ts` and include:

- Default organizations
- Admin and demo users
- Initial SSO applications
- Menu structure
- Default permissions and roles

## Fresh Database Setup

If you need to start with a completely fresh database:

```bash
# Reset database and apply all migrations
npx prisma migrate reset --force

# This will:
# 1. Drop the database
# 2. Recreate it
# 3. Apply all migrations
# 4. Run the seed script
```

## Migration Management

### Check Migration Status

```bash
npx prisma migrate status
```

### Rollback Migrations

```bash
# Mark a migration as rolled back (manual process required)
npx prisma migrate resolve --rolled-back <migration_name>
```

### Deploy to Production

```bash
# Deploy pending migrations to production
npx prisma migrate deploy
```

## Database Operations

### Generate Prisma Client

```bash
npx prisma generate
# or
npm run prisma:generate
```

### View Database in Browser

```bash
npx prisma studio
# or
npm run prisma:studio
```

### Validate Schema

```bash
npx prisma validate
```

## Best Practices

1. **Descriptive Migration Names**: Use clear, descriptive names for migrations

   ```bash
   npx prisma migrate dev --name add_nafath_integration
   npx prisma migrate dev --name update_user_permissions
   ```

2. **Test Migrations**: Always test migrations in development before production

3. **Backup Production**: Always backup production database before running migrations

4. **Review SQL**: Check the generated SQL in migration files before applying

5. **Schema Organization**: Keep related models in the same schema module file

## Troubleshooting

### Schema Drift Detected

If you see schema drift warnings:

```bash
# Reset development database
npx prisma migrate reset

# Or resolve drift manually
npx prisma db push --force-reset
```

### Migration Conflicts

If you encounter migration conflicts:

1. Coordinate with team members
2. Reset development database if safe
3. Create a new migration to resolve conflicts

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

---
