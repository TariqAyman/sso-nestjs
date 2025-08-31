# Prisma Schema Organization

This directory contains modular documentation for the Prisma schema to improve readability and maintainability. While Prisma requires a single `schema.prisma` file, we've organized the models into logical groups with separate documentation files.

## 📁 Schema Modules

### 1. User Management (`users.prisma`)

**Purpose**: Core user authentication and profile management

- `User`: Main user model with Nafath SSO integration
- `UserActivation`: Email/phone verification tokens
- `ForgotPassword`: Password reset functionality
- `LastLogin`: Login history and security tracking
- `PasswordResetToken`: Laravel-style password reset tokens

**Key Features**:

- Nafath national ID integration (`identify` field)
- Multi-language support (Arabic names)
- Comprehensive profile management
- Security tracking and audit trail

### 2. OAuth & SSO Integration (`oauth.prisma`)

**Purpose**: External OAuth provider integration and SSO application management

- `SsoApplication`: OAuth client registration
- `OauthConnection`: User provider connections
- `AuthorizationCode`: OAuth authorization codes
- `RefreshToken`: Token renewal management

**Supported Providers**:

- Nafath (Saudi national SSO)
- Google OAuth
- Facebook OAuth
- Custom OAuth providers

### 3. Permission & Role Management (`permissions.prisma`)

**Purpose**: Laravel Spatie-compatible permission system

- `Permission`: System permission definitions
- `Role`: User role definitions
- `ModelHasPermission`: Direct model permissions
- `ModelHasRole`: Direct model roles
- `RoleHasPermission`: Role-permission associations

**Features**:

- Polymorphic permission assignments
- Role-based access control (RBAC)
- Model-specific permissions
- Guard system compatibility

### 4. Token Management (`tokens.prisma`)

**Purpose**: API authentication and personal access tokens

- `PersonalAccessToken`: Laravel Sanctum-style tokens

**Features**:

- Scoped token access
- Token expiration management
- Ability-based restrictions

### 5. Microservice & Tenant Management (`microservices.prisma`)

**Purpose**: Multi-tenant microservice architecture

- `MicroService`: Service registration and configuration
- `Tenant`: Multi-tenant configuration (if implemented)

**Features**:

- Service discovery
- Health monitoring
- Multi-tenant isolation

### 6. SAML SSO Configuration (`saml.prisma`)

**Purpose**: Enterprise SAML SSO integration

- `SamlTenantSetting`: SAML IdP configuration

**Features**:

- SAML metadata management
- Certificate handling
- Tenant-specific SAML settings

### 7. Task Scheduling & Background Processing

**Purpose**: Automated background tasks and scheduled operations

- `Job`: Background job queue with payload and retry management
- `FailedJob`: Failed job debugging and recovery
- `WebhookLog`: Event delivery tracking with automatic retries

**Features**:

- Cron-based task scheduling with @nestjs/schedule
- Webhook retry automation (every 5 minutes)
- Daily cleanup of old webhook logs
- Extensible task framework for custom operations
- Comprehensive logging and error handling

## 🔧 Usage Guidelines

### Reading the Schema

1. Start with the main `schema.prisma` file for overview
2. Refer to specific module files for detailed documentation
3. Use the section headers in the main file for navigation

### Making Changes

1. **Always edit the main `schema.prisma` file** - Prisma doesn't support file splitting
2. Update corresponding documentation files when making changes
3. Run `npx prisma validate` after changes
4. Generate new migration with `npx prisma migrate dev`

### Database Operations

```bash
# Validate schema
npx prisma validate

# Generate migration
npx prisma migrate dev --name descriptive_name

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# View data in browser
npx prisma studio
```

## 📊 Schema Statistics

- **Total Models**: 24
- **Total Relations**: 45+
- **Primary Key Type**: BigInt (auto-increment)
- **Database**: MySQL
- **Migration Strategy**: Incremental with version control

## 🔗 Model Relationships

### Core User Flow

```
User → UserActivation (email/phone verification)
User → LastLogin (security tracking)
User → ForgotPassword (password reset)
User → PersonalAccessToken (API access)
```

### OAuth Integration

```
User → OauthConnection → SsoApplication
User → AuthorizationCode → RefreshToken
```

### Permission System

```
User → ModelHasRole → Role → RoleHasPermission → Permission
User → ModelHasPermission → Permission
```

### Enterprise Features

```
MicroService → SamlTenantSetting
User → Job → FailedJob
SsoApplication → LogWebhook
```

## 🚀 Getting Started

1. **Review the main schema**: Start with `../schema.prisma`
2. **Understand relationships**: Check the model relations
3. **Run migrations**: Apply the schema to your database
4. **Seed data**: Use `../seed.ts` for initial data
5. **Generate client**: Run `npx prisma generate`

## 📝 Notes

- This organization approach maintains Prisma's single-file requirement while improving code readability
- Documentation files are for reference only - edit the main schema file
- Use descriptive migration names for better version tracking
- Consider the impact of schema changes on existing data

## 🔍 Finding Specific Models

Use your editor's search functionality or these quick references:

- **Authentication**: User, UserActivation, ForgotPassword
- **OAuth/SSO**: SsoApplication, OauthConnection, AuthorizationCode
- **Permissions**: Permission, Role, ModelHasPermission, ModelHasRole
- **Tokens**: PersonalAccessToken, RefreshToken
- **Enterprise**: SamlTenantSetting, MicroService
- **Background**: Job, FailedJob, LogWebhook
