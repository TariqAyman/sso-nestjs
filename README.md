# NestJS Open SSO

A comprehensive Single Sign-On (SSO) solution built with NestJS, featuring Nafath integration, OAuth providers, and enterprise-grade authentication.

## 🚀 Features

- **Nafath SSO Integration**: Saudi national identity provider support
- **Multi-Provider OAuth**: Google, Facebook, and custom OAuth providers
- **Enterprise SAML**: SAML SSO for enterprise customers
- **Role-Based Permissions**: Laravel Spatie-compatible permission system
- **API Authentication**: Personal access tokens with scoped abilities
- **Multi-Tenant Support**: Microservice architecture with tenant isolation
- **Background Processing**: Queue system for webhooks and notifications
- **Comprehensive Audit**: Login tracking, security monitoring, and audit trails

## 📁 Project Structure

```
src/
├── auth/              # Authentication module (Passport strategies)
├── oauth/             # OAuth provider integration
├── sso/               # SSO application management
├── user/              # User management
├── common/            # Shared services and utilities
├── tasks/             # Background job processing
└── webhook/           # Webhook handling

prisma/
├── schema.prisma      # Main database schema (24 models)
├── schema/            # Modular schema documentation
│   ├── README.md      # Complete organization guide
│   ├── INDEX.md       # Quick reference
│   ├── users.prisma   # User management models
│   ├── oauth.prisma   # OAuth integration models
│   ├── permissions.prisma # Permission system models
│   └── ...            # Additional module documentation
├── migrations/        # Database migrations
└── seed.ts           # Database seeding
```

## 🗄️ Database Schema

Our Prisma schema is organized into logical modules for better readability:

### Core Models (24 total)

- **User Management** (5 models): Authentication, profiles, security tracking
- **OAuth & SSO** (4 models): External provider integration, authorization flows
- **Permissions** (5 models): Role-based access control system
- **Tokens** (1 model): API authentication and personal access tokens
- **Enterprise** (2 models): SAML configuration, microservice management
- **Background** (3 models): Job queue, webhook logging, notifications
- **Utility** (4 models): Password resets, activations, failed jobs

### Key Features

- **BigInt IDs**: Auto-incrementing primary keys for scalability
- **Nafath Integration**: National ID verification and Arabic name support
- **Multi-Tenant**: Tenant isolation and microservice architecture
- **Laravel Compatibility**: Spatie-compatible permission system
- **Enterprise Ready**: SAML SSO, audit trails, webhook reliability

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

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

### 3. Development

```bash
# Start development server
npm run start:dev

# Open database browser
npx prisma studio
```

## 📚 Documentation

- [`PRISMA_IMPLEMENTATION.md`](./PRISMA_IMPLEMENTATION.md) - Database implementation guide
- [`NAFATH_SCHEMA_UPDATES.md`](./NAFATH_SCHEMA_UPDATES.md) - Nafath integration details
- [`SSO_IMPLEMENTATION.md`](./SSO_IMPLEMENTATION.md) - SSO configuration guide
- [`OAUTH_SETUP_GUIDE.md`](./OAUTH_SETUP_GUIDE.md) - OAuth provider setup
- [`DATABASE_MIGRATION.md`](./DATABASE_MIGRATION.md) - Migration strategy

## 🔧 Available Scripts

```bash
npm run start:dev      # Development server
npm run build          # Production build
npm run test           # Run tests
npm run migration      # Create new migration
npm run db:reset       # Reset database (dev only)
npm run db:studio      # Open Prisma Studio
```

## 🌐 API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### OAuth

- `GET /oauth/:provider` - Initiate OAuth flow
- `GET /oauth/:provider/callback` - OAuth callback
- `POST /oauth/disconnect` - Disconnect provider

### SSO Applications

- `GET /sso/applications` - List SSO applications
- `POST /sso/applications` - Create SSO application
- `GET /sso/authorize` - SSO authorization endpoint

## 🔐 Environment Variables

```env
DATABASE_URL="mysql://user:password@localhost:3306/sso_db"
JWT_SECRET="your-jwt-secret"
NAFATH_CLIENT_ID="your-nafath-client-id"
NAFATH_CLIENT_SECRET="your-nafath-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
