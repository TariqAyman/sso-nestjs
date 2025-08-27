# Schema Module Index

Quick reference guide to all schema modules in this directory based on the new SSO system structure.

## 📋 Module Overview

| Module                    | File                      | Models   | Purpose                               |
| ------------------------- | ------------------------- | -------- | ------------------------------------- |
| **Organizations**         | `organizations.prisma`    | 1 model  | Multi-tenant organization management  |
| **SSO Applications**      | `sso-applications.prisma` | 1 model  | OAuth client and SSO app registration |
| **User Management**       | `users.prisma`            | 4 models | Authentication, profiles, security    |
| **OAuth & Authorization** | `oauth.prisma`            | 3 models | OAuth 2.0 flow and token management   |
| **Permissions & Roles**   | `permissions.prisma`      | 5 models | Role-based access control system      |
| **SAML Enterprise**       | `saml.prisma`             | 1 model  | SAML 2.0 tenant configuration         |
| **Navigation & Menus**    | `menus.prisma`            | 1 model  | System navigation management          |
| **Queue & Jobs**          | `jobs.prisma`             | 2 models | Background job processing             |
| **Webhooks & Logging**    | `webhooks.prisma`         | 1 model  | Event delivery and retry management   |

## 🔍 Quick Model Finder

### Core System Architecture

- `Organization` - Multi-tenant organization management
- `SsoApplication` - OAuth client registration and configuration
- `User` - Main user model with comprehensive features
- `LastLogin` - Login history and security tracking
- `PasswordResetToken` - Password reset token management
- `OauthConnection` - External OAuth provider connections

### Authentication & Authorization

- `AuthorizationCode` - OAuth 2.0 authorization code flow
- `RefreshToken` - OAuth refresh token management
- `PersonalAccessToken` - API authentication tokens

### Security & Permissions

- `Permission` - Application-scoped permissions
- `Role` - Application-scoped roles
- `ModelHasPermission` - Direct model permission assignments
- `ModelHasRole` - Direct model role assignments
- `RoleHasPermission` - Role-permission relationships

### Enterprise Features

- `Saml2Tenant` - SAML 2.0 enterprise SSO configuration
- `WebhookLog` - Event delivery tracking and retry management

### System Management

- `Menu` - Navigation menu hierarchy
- `Job` - Background job queue
- `FailedJob` - Failed job tracking

## 🏗️ Database Schema Features

### Multi-Tenant Architecture

- Organization-scoped users and applications
- Shared user applications support
- Isolated permission and role systems per application

### Comprehensive User Management

- JSON-based multi-language name support
- Multiple verification levels (email, phone, identity)
- Advanced security features (2FA, account locking)
- Login history and audit trails

### OAuth 2.0 Compliance

- Full authorization code flow support
- Refresh token management
- Scope-based authorization
- Token expiration and revocation

### Enterprise-Ready Features

- SAML 2.0 SSO integration
- Webhook delivery with retry logic
- Background job processing
- Comprehensive audit logging

### Performance Optimizations

- Strategic database indexes
- Generated columns for search
- Efficient foreign key relationships
- Optimized query patterns

## 📚 Usage Guidelines

1. **Schema Organization**: Each schema file contains logically related models
2. **Relationships**: Cross-references between schema files are handled through the main schema
3. **Migrations**: Use Prisma migrations to apply schema changes
4. **Documentation**: Each schema file includes detailed comments and purpose descriptions

### Background Processing

- `Job` - Background job queue
- `FailedJob` - Failed job tracking
- `LogWebhook` - Webhook delivery logs

## 🚀 Quick Actions

```bash
# Navigate to main schema
cd ../
cat schema.prisma

# Validate all changes
npx prisma validate

# Generate new migration
npx prisma migrate dev --name "your_change_description"

# Open database browser
npx prisma studio
```

## 📖 Documentation Files

Each module has detailed documentation:

- [`README.md`](./README.md) - Complete organization guide
- [`users.prisma`](./users.prisma) - User management models
- [`oauth.prisma`](./oauth.prisma) - OAuth integration models
- [`permissions.prisma`](./permissions.prisma) - Permission system models
- [`tokens.prisma`](./tokens.prisma) - Token management models
- [`microservices.prisma`](./microservices.prisma) - Microservice models
- [`saml.prisma`](./saml.prisma) - SAML configuration models

> **Note**: These files are documentation only. Always edit the main `../schema.prisma` file.
