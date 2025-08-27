# New Prisma Schema Documentation

This documentation covers the updated Prisma schema based on the new SSO database structure.

## 📁 Schema Structure

The new schema is contained in a single file `prisma/schema.prisma` and includes comprehensive models for a modern SSO system.

## 📋 Database Models Overview

### 1. Organization Management

- **Organization** - Multi-tenant organization management with settings and user application sharing

### 2. SSO Application Management

- **SsoApplication** - OAuth client registration with comprehensive configuration options
- **SsoApplicationStatus** (enum) - Application status management

### 3. User Management

- **User** - Comprehensive user model with multi-language support, security features, and audit fields
- **LastLogin** - Login history tracking with device/browser information
- **PasswordResetToken** - Secure password reset token management
- **OauthConnection** - External OAuth provider connections (Google, Facebook, etc.)

### 4. OAuth & Authorization

- **AuthorizationCode** - OAuth 2.0 authorization code flow support
- **RefreshToken** - Refresh token management with revocation support
- **PersonalAccessToken** - API authentication tokens

### 5. Permissions & Roles

- **Permission** - Application-scoped permissions
- **Role** - Application-scoped roles
- **ModelHasPermission** - Direct model permission assignments
- **ModelHasRole** - Direct model role assignments
- **RoleHasPermission** - Role-permission relationships

### 6. System & Navigation

- **Menu** - Hierarchical navigation menu system
- **MenuStatus** (enum) - Menu visibility states

### 7. Queue & Background Jobs

- **Job** - Background job queue management
- **FailedJob** - Failed job tracking and debugging

### 8. SAML & Enterprise SSO

- **Saml2Tenant** - SAML 2.0 enterprise SSO configuration

### 9. Webhook & Logging

- **WebhookLog** - Webhook delivery tracking with retry logic

## 🔗 Key Relationships

### Multi-Tenant Architecture

- Organizations contain Users and SsoApplications
- Users are scoped to Organizations
- Permissions and Roles are scoped to SsoApplications

### OAuth 2.0 Flow

- AuthorizationCodes link Users to SsoApplications
- RefreshTokens enable extended sessions
- All tokens respect application-specific expiration settings

### Permission System

- Permissions belong to SsoApplications
- Roles can have multiple Permissions
- Users can have direct Permissions or Roles
- Supports polymorphic model assignments

## 🚀 New Features

### Enhanced User Management

- JSON-based multi-language name fields
- Generated columns for efficient searching
- Advanced security features (2FA, account locking)
- Comprehensive audit trail

### Enterprise-Ready Features

- SAML 2.0 integration support
- Webhook delivery with automatic retries
- Background job processing
- Organization-level settings

### OAuth 2.0 Compliance

- Complete authorization code flow
- Refresh token support with revocation
- Scope-based authorization
- Application-specific token lifetimes

## 📊 Database Optimizations

### Indexes

- Strategic indexes for performance optimization
- Composite indexes for complex queries
- Generated column indexes for search features

### Foreign Key Constraints

- Proper cascade behavior for data integrity
- Referential integrity across all relationships
- Optimized for multi-tenant isolation

## 🔧 Schema Conversion Summary

### What Was Converted from SQL:

1. **organizations** table → `Organization` model
2. **sso_applications** table → `SsoApplication` model
3. **users** table → `User` model (enhanced with new fields)
4. **authorization_codes** table → `AuthorizationCode` model
5. **refresh_tokens** table → `RefreshToken` model
6. **permissions** table → `Permission` model
7. **roles** table → `Role` model
8. **model_has_permissions** table → `ModelHasPermission` model
9. **model_has_roles** table → `ModelHasRole` model
10. **role_has_permissions** table → `RoleHasPermission` model
11. **last_logins** table → `LastLogin` model
12. **password_reset_tokens** table → `PasswordResetToken` model
13. **oauth_connections** table → `OauthConnection` model
14. **personal_access_tokens** table → `PersonalAccessToken` model
15. **menus** table → `Menu` model
16. **jobs** table → `Job` model
17. **failed_jobs** table → `FailedJob` model
18. **saml2_tenants** table → `Saml2Tenant` model
19. **webhook_logs** table → `WebhookLog` model

### Key Improvements:

- Proper Prisma data types and constraints
- Optimized indexes and foreign keys
- Enum types for better type safety
- JSON fields for flexible data storage
- Generated columns for search optimization
- Multi-tenant architecture support

## 📚 Migration Notes

This schema represents a complete modernization of the SSO system with:

- Full multi-tenant support
- Enhanced security features
- Enterprise SSO capabilities
- Modern OAuth 2.0 compliance
- Background job processing
- Comprehensive audit logging

The schema is ready for production use and includes all necessary optimizations for performance and scalability.
