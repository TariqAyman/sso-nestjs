# NestJS Open SSO Backend

A comprehensive Single Sign-On (SSO) backend solution built with NestJS, featuring fresh database architecture, task scheduling, and enterprise-grade authentication.

## 🚀 Latest Features (August 2025)

- **Fresh Database Setup**: Clean migration system with `20250831093255_init`
- **Task Scheduling**: Automated webhook retries and cleanup tasks
- **Split Schema Architecture**: Organized Prisma schema for better maintainability
- **MySQL Optimization**: Enhanced performance with proper indexing
- **UUID-based IDs**: Scalable identifier system
- **Automated Seeding**: Comprehensive initial data setup
- **Background Processing**: Scheduled tasks for maintenance and monitoring

## 🏗️ Core Features

- **Nafath SSO Integration**: Saudi national identity provider support
- **Multi-Provider OAuth**: Google, Facebook, GitHub, Twitter, Microsoft
- **Enterprise SAML**: SAML SSO for enterprise customers
- **Role-Based Permissions**: Advanced permission system with application scoping
- **API Authentication**: Personal access tokens with scoped abilities
- **Multi-Tenant Support**: Organization-based architecture with tenant isolation
- **Webhook System**: Reliable webhook delivery with automatic retries
- **Comprehensive Audit**: Login tracking, security monitoring, and audit trails

## 📁 Project Structure

```
src/
├── auth/              # Authentication module (Passport strategies)
├── oauth/             # OAuth provider integration
├── sso/               # SSO application management
├── user/              # User management (legacy)
├── users/             # Enhanced user operations
├── tasks/             # Background task scheduling (NEW)
├── webhook/           # Webhook handling with retry logic
└── common/            # Shared services and utilities

prisma/
├── schema/            # Split schema files (NEW)
│   ├── schema.prisma          # Main schema configuration
│   ├── users.prisma           # User management models
│   ├── organizations.prisma   # Organization models
│   ├── sso-applications.prisma # SSO app models
│   ├── oauth.prisma           # OAuth integration models
│   ├── permissions.prisma     # Permission system models
│   ├── webhooks.prisma        # Webhook models
│   ├── jobs.prisma            # Job queue models
│   ├── menus.prisma           # Navigation models
│   └── saml.prisma            # SAML models
├── migrations/        # Clean migration history
│   └── 20250831093255_init/   # Fresh initial migration
└── seed.ts           # Enhanced database seeding
```

## 🗄️ Database Schema

Our Prisma schema is organized into logical modules with a fresh, clean architecture:

### Schema Organization (Split Architecture)

- **Users & Authentication** (4 files): User profiles, login tracking, password resets, OAuth connections
- **Organizations & Apps** (2 files): Multi-tenant organization structure, SSO applications
- **Permissions & Roles** (1 file): Application-scoped permission system
- **OAuth & Tokens** (1 file): Authorization codes, refresh tokens, personal access tokens
- **Infrastructure** (4 files): Jobs, webhooks, menus, SAML configurations

### Key Features

- **UUID IDs**: String-based UUIDs (VARCHAR(36)) for better scalability and security
- **MySQL Optimized**: Enhanced indexing and foreign key relationships
- **Fresh Migration**: Clean `20250831093255_init` migration starting point
- **Split Schema**: Better organization and maintainability
- **Automated Seeding**: Pre-configured with admin/demo accounts and sample data

### Default Seeded Data

After running `npm run prisma:seed`, you'll have:

- **Admin User**: `admin@opensso.com` / `Admin123!@#`
- **Demo User**: `demo@opensso.com` / `User123!@#`
- **Default Organization**: "Default Organization"
- **Demo SSO App**: Client ID: `demo_app_client_id`
- **Navigation Menus**: Dashboard, User Management, etc.

> 📖 **Schema Documentation**: See [`prisma/schema/README.md`](./prisma/schema/README.md) for detailed module documentation.

## 🛠️ Quick Start

### 1. Installation

```bash
npm install
```

### 2. Database Setup

```bash
# Configure environment
cp .env.example .env
# Edit .env with your MySQL database connection

# Fresh database setup (recommended)
npm run prisma:migrate:dev
npm run prisma:generate
npm run prisma:seed
```

**Note**: The project now uses MySQL with a clean migration system. The seed command will create default accounts and sample data for immediate testing.

### Alternative: Reset existing database

```bash
# If you need to completely reset the database
npx prisma migrate reset --force
```

### 3. Development

```bash
# Start development server
npm run start:dev

# Background tasks will automatically start
# - Webhook retries every 5 minutes
# - Daily log cleanup

# Open database browser
npm run prisma:studio
```

## � Background Tasks

The application includes automated background tasks:

- **Webhook Retries**: Failed webhooks are automatically retried every 5 minutes
- **Log Cleanup**: Old webhook logs are cleaned up daily at midnight
- **Task Monitoring**: All background tasks are logged with execution details

## � Available Scripts

```bash
npm run start:dev      # Development server with hot reload
npm run start:prod     # Production server
npm run build          # Production build
npm run test           # Run unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Test coverage

# Database operations
npm run prisma:migrate     # Create and apply migration
npm run prisma:generate    # Generate Prisma client
npm run prisma:seed        # Seed database with default data
npm run prisma:studio      # Open Prisma Studio
npm run prisma:deploy      # Deploy migrations (production)

# Development utilities
npm run format         # Format code with Prettier
npm run lint           # Lint code with ESLint
```

## 🌐 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login with email/password
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile

### OAuth Social Authentication

- `GET /api/v1/auth/:provider` - Initiate OAuth flow (google, github, facebook, twitter, microsoft)
- `GET /api/v1/auth/:provider/callback` - OAuth callback handler
- `POST /api/v1/auth/disconnect` - Disconnect OAuth provider

### Nafath Authentication

- `POST /api/v1/auth/nafath/initiate` - Start Nafath authentication
- `GET /api/v1/auth/nafath/status/:transactionId` - Check Nafath status
- `POST /api/v1/auth/nafath/verify` - Verify Nafath authentication

### SSO Applications

- `GET /api/v1/sso/applications` - List SSO applications
- `POST /api/v1/sso/applications` - Create SSO application
- `PUT /api/v1/sso/applications/:id` - Update SSO application
- `DELETE /api/v1/sso/applications/:id` - Delete SSO application

### OAuth 2.0 Endpoints

- `GET /api/v1/oauth/authorize` - Authorization endpoint
- `POST /api/v1/oauth/token` - Token endpoint
- `GET /api/v1/oauth/userinfo` - User info endpoint
- `GET /api/v1/oauth/.well-known/jwks.json` - JWKS endpoint

### Webhooks

- `GET /api/v1/webhooks/logs` - Get webhook execution logs
- `POST /api/v1/webhooks/:id/retry` - Manually retry failed webhook
- `GET /api/v1/webhooks/stats` - Webhook statistics and metrics

### User Management

- `GET /api/v1/users` - List users (admin)
- `GET /api/v1/users/:id` - Get user details
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## 🔐 Environment Variables

```env
# Database Configuration (MySQL)
DATABASE_URL="mysql://user:password@localhost:3306/opensso"

# JWT Configuration
JWT_SECRET="your-secure-jwt-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Logging Configuration
LOG_LEVEL="DEBUG"
LOG_REQUESTS="true"
LOG_RESPONSES="true"
LOG_HEADERS="true"

# Task Scheduling
ENABLE_TASK_SCHEDULING="true"
WEBHOOK_RETRY_INTERVAL="5m"
LOG_CLEANUP_RETENTION_DAYS="30"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Nafath Configuration
NAFATH_CLIENT_ID="your-nafath-client-id"
NAFATH_CLIENT_SECRET="your-nafath-client-secret"
NAFATH_ENABLED="true"
NAFATH_ENVIRONMENT="development"

# Application Settings
APP_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
API_PREFIX="/api/v1"
```

## 📚 Documentation

For detailed information, check out these documentation files:

- [`docs/PRISMA_IMPLEMENTATION.md`](./docs/PRISMA_IMPLEMENTATION.md) - Database implementation guide
- [`docs/NAFATH_INTEGRATION.md`](./docs/NAFATH_INTEGRATION.md) - Nafath integration details
- [`docs/SSO_IMPLEMENTATION.md`](./docs/SSO_IMPLEMENTATION.md) - SSO configuration guide
- [`docs/OAUTH_SETUP_GUIDE.md`](./docs/OAUTH_SETUP_GUIDE.md) - OAuth provider setup
- [`docs/DATABASE_MIGRATION.md`](./docs/DATABASE_MIGRATION.md) - Migration strategy

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode for development
npm run test:watch
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Environment Setup

- Configure production database URL
- Set secure JWT secrets
- Enable production logging
- Configure OAuth provider credentials
- Set up webhook endpoints

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
