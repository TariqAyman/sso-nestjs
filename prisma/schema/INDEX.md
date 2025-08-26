# Schema Module Index

Quick reference guide to all schema modules in this directory.

## 📋 Module Overview

| Module              | File                   | Models   | Purpose                            |
| ------------------- | ---------------------- | -------- | ---------------------------------- |
| **User Management** | `users.prisma`         | 5 models | Authentication, profiles, security |
| **OAuth & SSO**     | `oauth.prisma`         | 4 models | External provider integration      |
| **Permissions**     | `permissions.prisma`   | 5 models | Role-based access control          |
| **Tokens**          | `tokens.prisma`        | 1 model  | API authentication                 |
| **Microservices**   | `microservices.prisma` | 1 model  | Service architecture               |
| **SAML**            | `saml.prisma`          | 1 model  | Enterprise SSO                     |
| **Queue System**    | -                      | 3 models | Background processing              |

## 🔍 Quick Model Finder

### Authentication & Users

- `User` - Main user model with Nafath integration
- `UserActivation` - Email/phone verification
- `ForgotPassword` - Password reset tokens
- `LastLogin` - Login history tracking
- `PasswordResetToken` - Laravel-style resets

### OAuth & External Auth

- `SsoApplication` - OAuth client registration
- `OauthConnection` - User-provider connections
- `AuthorizationCode` - OAuth authorization flow
- `RefreshToken` - Token renewal

### Security & Permissions

- `Permission` - System permissions
- `Role` - User roles
- `ModelHasPermission` - Direct permissions
- `ModelHasRole` - Direct roles
- `RoleHasPermission` - Role permissions

### API & Tokens

- `PersonalAccessToken` - API authentication

### Enterprise & Architecture

- `MicroService` - Service registration
- `SamlTenantSetting` - SAML configuration

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
