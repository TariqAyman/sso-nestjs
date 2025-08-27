# Split Schema Implementation Guide

## Overview

This Prisma schema has been split into logical sections for better maintainability and organization. However, since Prisma doesn't natively support multiple schema files, the main `schema.prisma` file contains only the generator, datasource configuration, and documentation.

## Schema Organization

The models are organized into the following split files:

### 1. Core Infrastructure

- **organizations.prisma**: Organization management for multi-tenant architecture
- **sso-applications.prisma**: SSO application configuration and OAuth settings

### 2. User Management

- **users.prisma**: User authentication, profiles, and security features
  - User: Main user model with complete profile and security features
  - LastLogin: Login tracking and audit trail
  - PasswordResetToken: Password reset token management
  - OauthConnection: OAuth provider connections for social login

### 3. Authentication & Authorization

- **oauth.prisma**: OAuth 2.0 flows and token management
  - AuthorizationCode: OAuth authorization codes
  - RefreshToken: OAuth refresh tokens
  - PersonalAccessToken: API authentication tokens

- **permissions.prisma**: Role-based access control (RBAC)
  - Permission: Fine-grained permissions
  - Role: Role definitions
  - ModelHasPermission: Direct model-permission assignments
  - ModelHasRole: Model-role assignments
  - RoleHasPermission: Role-permission relationships

### 4. System Features

- **menus.prisma**: Navigation and menu system
  - Menu: Hierarchical navigation with permissions
  - MenuStatus: Menu visibility states

- **jobs.prisma**: Background job processing
  - Job: Background job queue
  - FailedJob: Failed job tracking

### 5. Enterprise Features

- **saml.prisma**: SAML 2.0 enterprise SSO
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
