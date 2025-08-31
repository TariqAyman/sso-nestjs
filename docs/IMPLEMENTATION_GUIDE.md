# Split Schema Implementation Guide

## Overview

This Prisma schema has been organized into logical modules for better maintainability and team collaboration. The schema follows a split architecture where related models are grouped together by domain functionality.

## Current Schema Status

- **Database Provider**: MySQL
- **Current Migration**: `20250831093255_init` (Fresh database setup)
- **Total Models**: 19 models across 9 domain modules
- **Schema Location**: `prisma/schema/` (Split architecture)
- **Main File**: `prisma/schema/schema.prisma` (Generator and datasource config)

## Schema Organization

The models are organized into the following logical modules:

### 1. Core Infrastructure

- **organizations.prisma**: Multi-tenant organization management
  - `Organization`: Core organization model with tenant isolation

- **sso-applications.prisma**: SSO application configuration and OAuth settings
  - `SsoApplication`: OAuth client registration and SSO app management
  - `SsoApplicationStatus`: Application status enumeration

### 2. User Management & Authentication

- **users.prisma**: Complete user authentication and profile system
  - `User`: Main user model with Nafath SSO integration and multi-language support
  - `LastLogin`: Login tracking and security audit trail
  - `PasswordResetToken`: Password reset token management
  - `OauthConnection`: External OAuth provider connections (Google, Facebook, etc.)

### 3. OAuth & Token Management

- **oauth.prisma**: OAuth 2.0 flows and API authentication
  - `AuthorizationCode`: OAuth authorization code flow
  - `RefreshToken`: OAuth refresh token management
  - `PersonalAccessToken`: API authentication tokens (Laravel Sanctum style)

### 4. Permission & Role System

- **permissions.prisma**: Laravel Spatie-compatible RBAC system
  - `Permission`: Application-scoped permission definitions
  - `Role`: Application-scoped role definitions
  - `ModelHasPermission`: Direct model-permission assignments
  - `ModelHasRole`: Direct model-role assignments
  - `RoleHasPermission`: Role-permission relationship mappings

### 5. Navigation & UI

- **menus.prisma**: System navigation and menu management
  - `Menu`: Hierarchical navigation system with permission-based access
  - `MenuStatus`: Menu visibility state enumeration

### 6. Background Processing

- **jobs.prisma**: Laravel-compatible background job processing
  - `Job`: Background job queue with payload and status tracking
  - `FailedJob`: Failed job debugging and retry management

### 7. Enterprise Features

- **saml.prisma**: SAML 2.0 enterprise SSO integration
  - `Saml2Tenant`: SAML identity provider configuration and certificate management

### 8. Event & Webhook System

- **webhooks.prisma**: Event-driven webhook system
  - `WebhookLog`: Webhook delivery tracking with retry logic and audit trail

## Usage Instructions

### For Development

When working with the split schemas:

1. **Edit Individual Files**: Make changes in the appropriate domain module file
2. **Maintain Relationships**: Ensure foreign key relationships are preserved across modules
3. **Use Main Schema**: Prisma operations use the consolidated `schema.prisma` file
4. **Reference Documentation**: Each module file contains detailed model documentation

### Database Operations

Since Prisma requires a single schema file, all operations use the main schema:

```bash
# Validate current schema
npx prisma validate

# Generate new migration
npx prisma migrate dev --name descriptive_name

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma migrate reset --force

# Seed database with initial data
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Schema Update Workflow

When updating the schema:

1. **Edit Module File**: Make changes in the appropriate split schema file (e.g., `users.prisma`)
2. **Update Documentation**: Document changes in the module file
3. **Validate Changes**: Run `npx prisma validate` to check syntax
4. **Generate Migration**: Use `npx prisma migrate dev --name your_change_name`
5. **Test Migration**: Verify the migration works correctly
6. **Update Seed Data**: Modify `seed.ts` if needed for new fields

## Model Relationships & Dependencies

### Core Relationships

```
Organization (1) ←→ (N) User                    # Multi-tenant user management
Organization (1) ←→ (N) SsoApplication         # Organization-scoped SSO apps
SsoApplication (1) ←→ (N) Permission           # App-scoped permissions
SsoApplication (1) ←→ (N) Role                 # App-scoped roles
SsoApplication (1) ←→ (N) AuthorizationCode    # OAuth authorization codes
SsoApplication (1) ←→ (N) RefreshToken         # OAuth refresh tokens
SsoApplication (1) ←→ (N) Saml2Tenant          # SAML configuration
SsoApplication (1) ←→ (N) WebhookLog           # Event delivery tracking
```

### User Relationships

```
User (1) ←→ (N) LastLogin              # Security tracking
User (1) ←→ (N) PasswordResetToken     # Password reset flow
User (1) ←→ (N) OauthConnection        # External provider connections
User (1) ←→ (N) AuthorizationCode      # OAuth authorization codes
User (1) ←→ (N) RefreshToken           # User's refresh tokens
User (1) ←→ (N) PersonalAccessToken    # API access tokens
User (N) ←→ (N) Permission (via ModelHasPermission)  # Direct permissions
User (N) ←→ (N) Role (via ModelHasRole)              # Direct roles
```

### Permission System

```
Role (N) ←→ (N) Permission (via RoleHasPermission)   # Role permissions
Menu (N) ←→ (N) Permission                           # Menu access control
```

## Key Features & Architecture

### 1. Multi-Tenant Architecture

- Organization-scoped data isolation
- App-scoped permissions and roles
- Tenant-specific SAML configurations

### 2. Comprehensive Authentication

- Local authentication with bcrypt
- OAuth 2.0 with multiple providers
- Nafath (Saudi national ID) integration
- SAML 2.0 for enterprise SSO

### 3. Flexible Permission System

- Laravel Spatie-compatible RBAC
- Direct model permissions
- Role-based permissions
- Application-scoped isolation

### 4. Event-Driven Architecture

- Webhook delivery system
- Automatic retry logic
- Complete audit trail
- Background job processing

### 5. Enterprise Features

- SAML 2.0 configuration
- Certificate management
- Multi-provider OAuth
- Hierarchical menu system

## Benefits of Split Schema Organization

### Development Benefits

1. **Domain Separation**: Related models grouped by business functionality
2. **Team Collaboration**: Different teams can work on different modules
3. **Code Organization**: Easier navigation and maintenance
4. **Focused Documentation**: Each module has specific documentation

### Maintenance Benefits

1. **Cleaner Git History**: More focused commits and diffs
2. **Easier Debugging**: Locate issues within specific domains
3. **Modular Updates**: Update specific areas without affecting others
4. **Better Testing**: Test specific model groups independently

### Scalability Benefits

1. **Future Microservices**: Easy to extract modules into separate services
2. **Clear Boundaries**: Well-defined domain boundaries
3. **Independent Evolution**: Modules can evolve at different rates
4. **Documentation**: Self-documenting architecture

## Migration History

### Current Status (August 31, 2025)

✅ **Fresh Database Setup**: Complete reset with `20250831093255_init` migration
✅ **All Models Migrated**: 19 models successfully organized into 9 modules
✅ **Relationships Preserved**: All foreign key relationships maintained
✅ **Seed Data Working**: Database seeding with initial organizations, users, and configurations
✅ **Documentation Updated**: All module files contain comprehensive documentation

### Database Statistics

- **Total Models**: 19
- **Total Enums**: 2 (SsoApplicationStatus, MenuStatus)
- **Primary Key Strategy**: Auto-incrementing BigInt
- **Foreign Key Strategy**: Consistent `@db.UnsignedBigInt` for MySQL compatibility
- **Index Strategy**: Optimized for common query patterns

## Getting Started

### 1. Explore the Schema

```bash
# Start with the main schema file
cat prisma/schema/schema.prisma

# Explore individual modules
ls prisma/schema/*.prisma

# View user management models
cat prisma/schema/users.prisma
```

### 2. Set Up Database

```bash
# Apply migrations
npx prisma migrate dev

# Seed with initial data
npx prisma db seed

# Verify setup
npx prisma studio
```

### 3. Development Workflow

```bash
# Make schema changes in module files
vim prisma/schema/users.prisma

# Generate migration
npx prisma migrate dev --name add_user_preferences

# Update seed data if needed
vim prisma/seed.ts
```

## Troubleshooting

### Common Issues

1. **Migration Conflicts**: Use `npx prisma migrate reset` for fresh start
2. **Relationship Errors**: Check foreign key definitions across modules
3. **Seed Failures**: Verify referential integrity in `seed.ts`
4. **Client Generation**: Run `npx prisma generate` after schema changes

### Best Practices

1. **Consistent Naming**: Follow established naming conventions
2. **Documentation**: Update module documentation with changes
3. **Testing**: Test migrations before applying to production
4. **Backup**: Always backup production before major changes

## Future Considerations

### Potential Enhancements

1. **Microservice Extraction**: Individual modules can become separate services
2. **Schema Federation**: GraphQL federation with separate schemas
3. **Event Sourcing**: Add event sourcing capabilities
4. **Audit Logging**: Enhanced audit trail for all model changes

The schema is production-ready and provides a solid foundation for scaling the Open SSO system.

- Saml2Tenant: SAML identity provider configuration

- **webhooks.prisma**: Webhook event system
  - WebhookLog: Webhook delivery tracking and retry management

## Usage Instructions

### For Development

When working with the split schemas:

1. **Reference Models**: All models are documented in their respective split files
2. **Edit Specific Areas**: Modify only the relevant split schema file for your changes
3. **Maintain Relationships**: Ensure foreign key relationships are properly maintained across files

### For Production/Migration

Since Prisma requires a single schema file:

1. **Use Main Schema**: The current `schema.prisma` file contains all models consolidated
2. **Migration Commands**: Run standard Prisma commands against the main schema:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db push
   ```

### For Schema Updates

When updating the schema:

1. **Edit Split Files**: Make changes in the appropriate split schema file
2. **Update Main Schema**: Manually sync changes to the main `schema.prisma` file
3. **Run Validation**: Test with `npx prisma validate`
4. **Generate Migration**: Use `npx prisma migrate dev` for database changes

## Model Relationships

### Key Foreign Key Relationships

```
Organization (1) → (N) User
Organization (1) → (N) SsoApplication
SsoApplication (1) → (N) AuthorizationCode
SsoApplication (1) → (N) RefreshToken
SsoApplication (1) → (N) Permission
SsoApplication (1) → (N) Role
SsoApplication (1) → (N) Saml2Tenant
SsoApplication (1) → (N) WebhookLog
User (1) → (N) LastLogin
User (1) → (N) PasswordResetToken
User (1) → (N) OauthConnection
User (1) → (N) AuthorizationCode
User (1) → (N) RefreshToken
```

### Enum Dependencies

- `SsoApplicationStatus` (in sso-applications.prisma)
- `MenuStatus` (in menus.prisma)

## Benefits of Split Schema Organization

1. **Maintainability**: Each domain area is in its own file
2. **Team Collaboration**: Different teams can work on different schema areas
3. **Code Organization**: Related models are grouped together
4. **Documentation**: Each file has focused documentation
5. **Debugging**: Easier to locate and fix schema issues
6. **Version Control**: Cleaner git diffs and merge conflicts

## Current Status

✅ All 19 models successfully split into logical files
✅ Complete relationships preserved
✅ All enums properly included
✅ Documentation updated
✅ Ready for database migration

The schema is now ready for production use with `npx prisma migrate dev` or `npx prisma db push`.
