# NestJS Open SSO Implementation

## Overview

This NestJS application provides a complete Single Sign-On (SSO) solution with OAuth 2.0 support, comprehensive application management, and webhook notifications.

## Features Implemented

### ✅ Complete SSO Application Management

- **CRUD Operations**: Create, read, update, delete SSO applications
- **Client Credentials**: Automatic generation of client_id and client_secret
- **Security Features**: Client secret regeneration, application status management
- **Scope Management**: Configurable OAuth scopes per application
- **Webhook Integration**: Optional webhook URLs for event notifications

### ✅ OAuth 2.0 Authorization Server

- **Authorization Code Flow**: Full OAuth 2.0 authorization code implementation
- **Token Management**: Access tokens (JWT) and refresh tokens
- **User Consent**: Authorization consent flow
- **Token Revocation**: Support for token revocation
- **OpenID Connect Discovery**: Well-known endpoints for OIDC

### ✅ Webhook System

- **Event Notifications**: Real-time webhook notifications for SSO events
- **Retry Logic**: Automatic retry with exponential backoff for failed webhooks
- **Webhook Logs**: Comprehensive logging and monitoring of webhook deliveries
- **Signature Verification**: HMAC-SHA256 signatures for webhook security
- **Management UI**: API endpoints for webhook log management

### ✅ Database Schema

- **MySQL Integration**: Complete Prisma schema with proper relations
- **Authorization Codes**: Temporary codes for OAuth flow
- **Refresh Tokens**: Long-lived tokens for token refresh
- **Webhook Logs**: Detailed webhook delivery tracking
- **User Management**: Enhanced user model with OAuth fields

## API Endpoints

### SSO Application Management

```
POST   /sso/applications              # Create new SSO application
GET    /sso/applications              # List user's SSO applications
GET    /sso/applications/:id          # Get SSO application details
PUT    /sso/applications/:id          # Update SSO application
DELETE /sso/applications/:id          # Delete SSO application
POST   /sso/applications/:id/regenerate-secret # Regenerate client secret
```

### OAuth 2.0 Endpoints

```
GET    /oauth/authorize               # Authorization endpoint
POST   /oauth/token                   # Token endpoint
POST   /oauth/token/refresh           # Refresh token endpoint
GET    /oauth/userinfo                # UserInfo endpoint
POST   /oauth/revoke                  # Token revocation endpoint
GET    /oauth/.well-known/openid_configuration # OpenID Connect Discovery
GET    /oauth/.well-known/jwks.json  # JSON Web Key Set
```

### Webhook Management

```
GET    /webhooks/logs                 # Get webhook logs
GET    /webhooks/logs/:id             # Get webhook log details
POST   /webhooks/retry/:id            # Retry failed webhook
GET    /webhooks/stats                # Get webhook statistics
```

## OAuth 2.0 Flow Implementation

### 1. Application Registration

```typescript
const application = {
  applicationName: "My App",
  applicationUrl: "https://myapp.com",
  redirectUri: "https://myapp.com/auth/callback",
  scope: "read write",
  webhookUrl: "https://myapp.com/webhooks/sso",
};
```

### 2. Authorization Request

```
GET /oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=read&state=STATE
```

### 3. Token Exchange

```typescript
const tokenResponse = await fetch("/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code: "AUTHORIZATION_CODE",
    redirect_uri: "REDIRECT_URI",
    client_id: "CLIENT_ID",
    client_secret: "CLIENT_SECRET",
  }),
});
```

### 4. Access User Information

```typescript
const userInfo = await fetch("/oauth/userinfo", {
  headers: { Authorization: "Bearer ACCESS_TOKEN" },
});
```

## Webhook Events

### Supported Events

- `authorization_granted`: User authorized access to application
- `token_issued`: Access token issued to application
- `token_refreshed`: Access token refreshed
- `user_updated`: User profile information updated

### Webhook Payload Example

```json
{
  "event": "authorization_granted",
  "userId": 123,
  "scope": "read write",
  "application_id": "client_123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "delivered_at": "2024-01-01T00:00:00.000Z"
}
```

### Webhook Security

- HMAC-SHA256 signature in `X-Webhook-Signature` header
- Event type in `X-Webhook-Event` header
- Automatic retry with exponential backoff (max 3 attempts)

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="mysql://opensso_user:secure_password@localhost:3306/opensso"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="1h"

# Application
APP_URL="http://localhost:3000"
APP_NAME="Open SSO"

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Database Setup

### 1. Create Database

```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

### 2. Run Migrations

```bash
npx prisma db push
```

### 3. Seed Initial Data

```bash
npx prisma db seed
```

## Security Features

### Application Security

- **Client Credentials**: Secure generation and storage
- **Scope Validation**: Strict scope checking
- **Origin Validation**: Configurable allowed origins
- **Rate Limiting**: Built-in rate limiting protection

### Token Security

- **JWT Tokens**: Signed with HS256 algorithm
- **Short Expiration**: Configurable token expiration (default 1 hour)
- **Refresh Tokens**: Secure refresh token rotation
- **Token Revocation**: Support for immediate token invalidation

### Webhook Security

- **HMAC Signatures**: Cryptographic verification of webhook payloads
- **Retry Logic**: Secure retry mechanism with limits
- **Audit Logging**: Comprehensive webhook delivery logging

## Monitoring and Logging

### Webhook Analytics

- Delivery success/failure rates
- Retry attempts and outcomes
- Event type distribution
- Application-specific metrics

### Application Metrics

- OAuth flow completion rates
- Token usage patterns
- User authorization trends
- Error rates and types

## Next Steps

The following features can be added for enhanced functionality:

1. **Frontend Dashboard**: React/Next.js admin interface
2. **SAML Support**: SAML 2.0 identity provider capabilities
3. **Multi-factor Authentication**: Enhanced security options
4. **Social Login Integration**: Google, GitHub, Microsoft OAuth
5. **Advanced Analytics**: Detailed usage reports and insights
6. **API Rate Limiting**: Per-application rate limiting
7. **Custom Claims**: Configurable JWT claims per application

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:e2e
```

### Manual Testing

Use the provided Postman collection for comprehensive API testing.

## Support

For issues and questions:

1. Check the application logs
2. Review webhook delivery logs
3. Verify environment configuration
4. Consult the OAuth 2.0 specification for flow details

This implementation provides a production-ready SSO solution with comprehensive OAuth 2.0 support and enterprise-grade webhook functionality.
