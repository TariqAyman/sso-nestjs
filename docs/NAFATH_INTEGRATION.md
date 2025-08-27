# Nafath SSO Integration Guide

This guide explains how to use the Nafath SSO integration in the Open SSO project.

## Overview

Nafath (نفاذ) is Saudi Arabia's unified national digital identity platform. This integration allows users to authenticate using their Saudi National ID or Iqama through the Nafath mobile app.

## Features

- **Push Notifications**: Users receive authentication requests directly in their Nafath mobile app
- **QR Code Authentication**: Users can scan QR codes to authenticate
- **Real-time Status Updates**: Frontend polls for authentication status updates
- **Automatic User Creation**: Creates user accounts automatically upon successful authentication
- **OAuth-like Flow**: Follows similar patterns to other OAuth providers (Google, Facebook, etc.)

## Backend API Endpoints

### 1. Initiate Authentication

```bash
POST /api/auth/nafath/initiate
Content-Type: application/json

{
  "nationalId": "1234567890",
  "channel": "PUSH" // or "QR"
}
```

**Response:**

```json
{
  "transactionId": "nafath_1234567890_abcdef",
  "qrCode": "data:image/svg+xml;base64,...", // Only for QR channel
  "expiresIn": 300,
  "message": "Please approve the authentication request in your Nafath app"
}
```

### 2. Check Authentication Status

```bash
GET /api/auth/nafath/status/:transactionId
```

**Response:**

```json
{
  "status": "PENDING", // PENDING, APPROVED, REJECTED, EXPIRED
  "profile": {
    // Only present when status is APPROVED
    "nationalId": "1234567890",
    "fullNameAr": "محمد أحمد السالم",
    "fullNameEn": "Mohammed Ahmed Al-Salem",
    "dateOfBirth": "1990-01-15",
    "nationality": "SA",
    "mobile": "+966501234567",
    "email": "mohammed.salem@example.com"
  }
}
```

### 3. Verify Transaction and Get Tokens

```bash
POST /api/auth/nafath/verify
Content-Type: application/json

{
  "transactionId": "nafath_1234567890_abcdef"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "mohammed.salem@example.com",
    "fullName": "Mohammed Ahmed Al-Salem",
    "verified": true,
    "role": "user",
    "twoFactorEnabled": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### 4. Nafath Callback (for webhooks)

```bash
POST /api/auth/nafath/callback
Content-Type: application/json
X-Nafath-Signature: hmac-sha256-signature

{
  "transactionId": "nafath_1234567890_abcdef",
  "status": "APPROVED",
  "nationalId": "1234567890",
  "fullNameAr": "محمد أحمد السالم",
  "fullNameEn": "Mohammed Ahmed Al-Salem",
  "dateOfBirth": "1990-01-15",
  "nationality": "SA",
  "mobile": "+966501234567",
  "email": "mohammed.salem@example.com"
}
```

## Frontend Integration

### Using the NafathLogin Component

```tsx
import NafathLogin from "@/components/NafathLogin";

function LoginPage() {
  const handleSuccess = (token: string) => {
    // Store token and redirect user
    localStorage.setItem("accessToken", token);
    window.location.href = "/dashboard";
  };

  const handleError = (error: string) => {
    console.error("Nafath authentication failed:", error);
  };

  return (
    <div>
      <NafathLogin onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
}
```

### Manual Integration

```tsx
import { useState, useEffect } from "react";

function NafathAuth() {
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");

  // 1. Initiate authentication
  const initiate = async (nationalId: string) => {
    const response = await fetch("/api/auth/nafath/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nationalId, channel: "PUSH" }),
    });

    const data = await response.json();
    setTransactionId(data.transactionId);
    setStatus("pending");
  };

  // 2. Poll for status updates
  useEffect(() => {
    if (transactionId && status === "pending") {
      const interval = setInterval(async () => {
        const response = await fetch(
          `/api/auth/nafath/status/${transactionId}`
        );
        const data = await response.json();

        if (data.status === "APPROVED") {
          setStatus("approved");
          // Verify and get tokens
          const verifyResponse = await fetch("/api/auth/nafath/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId }),
          });

          if (verifyResponse.ok) {
            const result = await verifyResponse.json();
            // Handle successful authentication
            console.log("Access token:", result.accessToken);
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [transactionId, status]);

  return (
    <div>
      <input
        type="text"
        placeholder="National ID"
        onBlur={(e) => initiate(e.target.value)}
      />
      <p>Status: {status}</p>
    </div>
  );
}
```

## Environment Configuration

### Backend (.env)

```env
# Nafath Configuration
NAFATH_BASE_URL=https://nafath.example.com
NAFATH_CLIENT_ID=your-nafath-client-id
NAFATH_CLIENT_SECRET=your-nafath-client-secret
NAFATH_CALLBACK_SECRET=your-nafath-callback-secret
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

## Development & Testing

### Mock Responses

During development, the Nafath service returns mock responses based on transaction ID patterns:

- Transaction IDs ending with '1' or containing 'approved' → APPROVED
- Transaction IDs ending with '2' or containing 'rejected' → REJECTED
- Transaction IDs ending with '3' or containing 'expired' → EXPIRED
- All others → PENDING

### Testing Flow

1. Start the backend: `npm run start:dev`
2. Start the frontend: `npm run dev`
3. Navigate to the login page
4. Enter a test National ID (e.g., "1234567891" for approved)
5. Choose authentication method (PUSH or QR)
6. Click "Authenticate with Nafath"
7. Wait for the mock approval (or test different scenarios)

## Production Setup

### 1. Obtain Nafath Credentials

Contact SDAIA/NIC to:

- Register your application
- Obtain client credentials
- Get callback/webhook endpoints whitelisted
- Receive API documentation and specifications

### 2. Update API Integration

Replace mock implementations in `NafathService` with real API calls:

```typescript
// In nafath.service.ts
async initiateAuth(nationalId: string, channel: 'PUSH' | 'QR') {
  const response = await firstValueFrom(
    this.httpService.post(`${this.nafathBaseUrl}/api/v1/authenticate`, {
      client_id: this.clientId,
      national_id: nationalId,
      channel: channel,
      callback_url: `${process.env.APP_URL}/api/auth/nafath/callback`,
    }, {
      headers: {
        'Authorization': `Bearer ${this.clientSecret}`,
        'Content-Type': 'application/json'
      }
    })
  );

  return {
    transactionId: response.data.transaction_id,
    qrCode: response.data.qr_code,
    expiresIn: response.data.expires_in || 300
  };
}
```

### 3. Security Considerations

- **HTTPS Only**: Ensure all communication uses HTTPS in production
- **Signature Verification**: Implement proper webhook signature verification
- **Rate Limiting**: Add rate limiting to prevent abuse
- **Input Validation**: Validate all National ID inputs
- **Token Security**: Use secure, HttpOnly cookies for token storage
- **Audit Logging**: Log all authentication attempts and outcomes

## Error Handling

### Common Error Scenarios

1. **Invalid National ID Format**:
   - Error: "Invalid national ID format"
   - Solution: Validate 10-digit format starting with 1 or 2

2. **Transaction Expired**:
   - Error: "Authentication request expired"
   - Solution: User needs to restart authentication

3. **User Rejection**:
   - Error: "Authentication was rejected"
   - Solution: User can retry authentication

4. **Network Issues**:
   - Error: "Failed to connect to Nafath service"
   - Solution: Check connectivity and retry

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### Backend Issues

1. **Check logs**: `tail -f logs/application.log`
2. **Verify environment variables**: Ensure all Nafath config is set
3. **Test API endpoints**: Use Postman or curl to test directly
4. **Database connectivity**: Verify user creation/update works

### Frontend Issues

1. **Check browser console**: Look for network errors
2. **Verify API routes**: Ensure Next.js API routes are working
3. **Test polling logic**: Check if status updates are received
4. **Component state**: Verify React state updates correctly

### Integration Issues

1. **Callback URL**: Ensure callback URL is whitelisted with Nafath
2. **Signature verification**: Check HMAC signature validation
3. **Timezone handling**: Ensure consistent timezone handling
4. **Character encoding**: Verify Arabic text handling

## Support

For technical support:

- Check the logs in `/logs` directory
- Review the API documentation
- Contact the development team
- Submit issues via the project repository

For Nafath-specific issues:

- Contact SDAIA/NIC support
- Check Nafath service status
- Verify your application registration
