# NestJS Open SSO Implementation Guide

This document provides a comprehensive overview of the NestJS Open SSO implementation.

## Project Architecture

### Technology Stack

- **Framework**: NestJS 11.1.6 (Node.js framework)
- **Database**: MySQL with Prisma ORM 6.15.0
- **Authentication**: JWT, OAuth 2.0, SAML 2.0
- **Task Scheduling**: @nestjs/schedule with cron jobs
- **API Documentation**: Swagger/OpenAPI
- **Caching**: Redis integration
- **Rate Limiting**: Express rate limit with throttling

## Project Structure

```
src/
├── auth/               # Authentication module
│   ├── controllers/    # Auth endpoints (login, register, etc.)
│   ├── services/      # Authentication business logic
│   ├── strategies/    # Passport strategies (JWT, Local, OAuth)
│   └── guards/        # Route protection guards
├── oauth/             # OAuth provider integration
│   ├── controllers/   # OAuth flow endpoints
│   ├── services/      # OAuth provider services
│   └── strategies/    # OAuth strategies (Google, Facebook, etc.)
├── sso/               # SSO core functionality
│   ├── controllers/   # SSO management endpoints
│   ├── services/      # SSO business logic
│   └── dto/           # Data transfer objects
├── user/              # User profile management
├── users/             # User CRUD operations
├── webhook/           # Webhook handling and delivery
│   ├── services/      # Webhook delivery logic
│   └── dto/           # Webhook payloads
├── tasks/             # Background task processing
│   ├── task.service.ts # Scheduled tasks (webhook retries, cleanup)
│   └── task.module.ts # Task scheduling configuration
├── common/            # Shared modules and utilities
│   ├── decorators/    # Custom decorators
│   ├── filters/       # Exception filters
│   ├── interceptors/  # Request/response interceptors
│   └── pipes/         # Validation pipes
├── app.module.ts      # Main application module
└── main.ts           # Application bootstrap
```

### External Directories

```
prisma/
├── schema/           # Split schema architecture
│   ├── schema.prisma          # Main schema configuration
│   ├── organizations.prisma   # Organization management
│   ├── users.prisma          # User authentication
│   ├── oauth.prisma          # OAuth flows
│   ├── permissions.prisma    # RBAC system
│   └── ...other modules
├── migrations/       # Database migrations
└── seed.ts          # Database seeding

scripts/
└── setup-database.sh # Database initialization script

docs/
├── README.md         # Schema documentation
├── IMPLEMENTATION_GUIDE.md
├── NAFATH_INTEGRATION.md
└── ...other guides
```

## Key Features

### 1. Multi-Provider Authentication

- **Local Authentication**: Username/password with bcrypt hashing
- **OAuth 2.0 Providers**: Google, Facebook, GitHub, Microsoft, Twitter
- **Nafath SSO**: Saudi national identity integration
- **SAML 2.0**: Enterprise SSO for organizations
- **JWT Tokens**: Stateless authentication with refresh tokens

### 2. Permission & Role Management

- **Role-Based Access Control (RBAC)**: Granular permission system
- **Laravel Spatie Compatible**: Permission structure similar to Laravel
- **Dynamic Permissions**: Runtime permission checking
- **Model-Level Permissions**: Direct model permission assignments

### 3. SSO Application Management

- **OAuth Client Registration**: Dynamic OAuth client creation
- **Multi-Tenant Support**: Organization-scoped applications
- **Callback URL Management**: Flexible redirect URI handling
- **API Key Management**: Secure API access tokens

### 4. Background Task Processing

- **Webhook Retry System**: Automatic failed webhook retries (every 5 minutes)
- **Cleanup Tasks**: Daily cleanup of old webhook logs
- **Extensible Architecture**: Easy to add new scheduled tasks

### 5. Webhook Management

- **Event-Driven Architecture**: Real-time event notifications
- **Retry Logic**: Exponential backoff for failed deliveries
- **Delivery Tracking**: Complete audit trail of webhook attempts
- **Multiple Event Types**: User creation, login, SSO events

### 6. API Features

- **RESTful Design**: Consistent API structure
- **OpenAPI Documentation**: Auto-generated Swagger docs
- **Rate Limiting**: Configurable request throttling
- **Input Validation**: Class-validator based validation
- **Error Handling**: Consistent error responses

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/openSSO"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Nafath Integration
NAFATH_CLIENT_ID="your-nafath-client-id"
NAFATH_CLIENT_SECRET="your-nafath-client-secret"
NAFATH_BASE_URL="https://nafath-api.absher.sa"

# Redis (Optional - for caching)
REDIS_URL="redis://localhost:6379"

# Application
APP_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
PORT=3000
```

## Getting Started

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd nestjs-open-sso

# Install dependencies
npm install
```

### 2. Database Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

### 3. Development Server

```bash
# Start development server
npm run start:dev

# The server will be available at http://localhost:3000
# API documentation at http://localhost:3000/api
```

## Useful Commands

### Development

```bash
# Development mode with auto-reload
npm run start:dev

# Debug mode
npm run start:debug

# Production build
npm run build
npm run start:prod
```

### Database Operations

```bash
# Generate Prisma client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Reset database (development only)
npx prisma migrate reset --force

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints Overview

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

### OAuth Providers

- `GET /auth/{provider}` - Initiate OAuth flow
- `GET /auth/{provider}/callback` - OAuth callback
- `POST /auth/{provider}/connect` - Connect existing account

### SSO Management

- `GET /sso/applications` - List SSO applications
- `POST /sso/applications` - Create SSO application
- `PUT /sso/applications/:id` - Update SSO application
- `DELETE /sso/applications/:id` - Delete SSO application

### User Management

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/:id` - Get user by ID (admin)
- `PUT /users/:id` - Update user (admin)

### Webhooks

- `GET /webhooks` - List webhook logs
- `POST /webhooks/retry/:id` - Retry failed webhook

## Security Features

### 1. Authentication Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Short-lived access tokens + refresh tokens
- **Rate Limiting**: Configurable request throttling
- **Input Validation**: Comprehensive request validation

### 2. Authorization

- **Route Guards**: Protect endpoints with JWT validation
- **Permission Guards**: Check user permissions for actions
- **Role Guards**: Verify user roles for resources

### 3. Data Protection

- **Input Sanitization**: Prevent SQL injection and XSS
- **CORS Configuration**: Configurable cross-origin settings
- **Helmet Integration**: Security headers middleware

## Deployment Considerations

### 1. Production Environment

- Use environment-specific configuration
- Enable production logging
- Set up proper error monitoring
- Configure Redis for session storage

### 2. Database

- Use connection pooling
- Set up regular backups
- Monitor performance metrics
- Configure read replicas if needed

### 3. Security

- Use HTTPS in production
- Rotate JWT secrets regularly
- Monitor for security vulnerabilities
- Set up proper firewall rules

## Troubleshooting

### Common Issues

1. **Database Connection**: Check DATABASE_URL and MySQL service
2. **JWT Errors**: Verify JWT_SECRET configuration
3. **OAuth Issues**: Check provider client ID/secret
4. **Migration Errors**: Run `npx prisma migrate reset` for fresh start

### Debugging

- Check application logs
- Use Prisma Studio for database inspection
- Verify environment variable configuration
- Test API endpoints with Swagger UI

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Passport.js Strategies](http://www.passportjs.org/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

---
