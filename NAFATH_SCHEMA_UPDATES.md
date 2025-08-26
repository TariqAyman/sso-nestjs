# Nafath Integration Updates for New Prisma Schema

## Overview

With the new Prisma schema implementation, the existing Nafath SSO integration needs to be updated to work with the new database structure and field mappings.

## 🔄 **Required Service Updates**

### 1. **NafathService Updates**

#### User Creation for Nafath Authentication

```typescript
// OLD: Using string ID and email-based user creation
const user = await this.prisma.user.create({
  data: {
    email: nafathProfile.email,
    fullName: nafathProfile.fullNameEn,
    verified: true,
    verifiedAt: new Date(),
  },
});

// NEW: Using BigInt ID and identify-based user creation
const user = await this.prisma.user.create({
  data: {
    identify: nafathProfile.nationalId, // Primary identifier for Nafath users
    name: nafathProfile.fullNameEn,
    nameAr: nafathProfile.fullNameAr, // Arabic name support
    email: nafathProfile.email, // Optional for Nafath users
    nationality: nafathProfile.nationality,
    country: nafathProfile.country,
    dateOfBirth: nafathProfile.dateOfBirth,
    nationalityCode: nafathProfile.nationalityCode,
    identifyVerifiedAt: new Date(), // Nafath verification timestamp
    role: 0, // Regular user role (numeric)
    type: 0, // Regular user type
    verified: true, // Legacy field for compatibility
    verifiedAt: new Date(), // Legacy field
  },
});
```

#### User Lookup for Nafath

```typescript
// OLD: Email-based lookup
const existingUser = await this.prisma.user.findUnique({
  where: { email: nafathProfile.email },
});

// NEW: National ID-based lookup (more accurate for Nafath)
const existingUser = await this.prisma.user.findUnique({
  where: { identify: nafathProfile.nationalId },
});

// Fallback for users with both email and national ID
const existingUser = await this.prisma.user.findFirst({
  where: {
    OR: [
      { identify: nafathProfile.nationalId },
      { email: nafathProfile.email },
    ],
  },
});
```

### 2. **AuthService Updates**

#### JWT Token Payload

```typescript
// OLD: String-based user ID
const payload = {
  sub: user.id, // String UUID
  email: user.email,
  role: user.role, // String role
};

// NEW: BigInt-based user ID with proper serialization
const payload = {
  sub: user.id.toString(), // Convert BigInt to string for JWT
  identify: user.identify, // National ID as primary identifier
  email: user.email,
  name: user.name,
  nameAr: user.nameAr,
  role: user.role, // Numeric role
  type: user.type, // User type
  verified: user.identifyVerifiedAt ? true : false,
};
```

#### User Validation in Guards

```typescript
// OLD: String ID parsing
const userId = payload.sub;
const user = await this.prisma.user.findUnique({
  where: { id: userId },
});

// NEW: BigInt ID parsing
const userId = BigInt(payload.sub); // Convert string back to BigInt
const user = await this.prisma.user.findUnique({
  where: { id: userId },
  include: {
    personalAccessTokens: true, // Include API tokens
    modelHasPermissions: {
      // Include permissions
      include: { permission: true },
    },
    modelHasRoles: {
      // Include roles
      include: { role: true },
    },
  },
});
```

### 3. **Database Entity Updates**

#### User Entity/DTO Updates

```typescript
// Update UserDto to include new Nafath fields
export class UserDto {
  id: string; // BigInt serialized as string
  identify?: string; // National ID (NEW)
  name?: string; // Full name (NEW)
  nameAr?: string; // Arabic name (NEW)
  email?: string; // Email (now optional)
  phone?: string; // Phone number (NEW)
  nationality?: string; // Nationality (NEW)
  country?: string; // Country (NEW)
  dateOfBirth?: Date; // Date of birth (NEW)
  identifyVerifiedAt?: Date; // Nafath verification (NEW)

  // Legacy fields for backward compatibility
  fullName?: string;
  verified?: boolean;
  role?: number; // Changed from string to number
}
```

### 4. **Controller Updates**

#### Nafath Authentication Endpoints

```typescript
@Controller("auth")
export class AuthController {
  @Post("nafath/callback")
  async handleNafathCallback(@Body() callbackDto: NafathCallbackDto) {
    // Updated to work with new user schema
    const result = await this.authService.handleNafathCallback(callbackDto);

    return {
      success: true,
      user: {
        id: result.user.id.toString(), // Serialize BigInt
        identify: result.user.identify,
        name: result.user.name,
        nameAr: result.user.nameAr,
        email: result.user.email,
        verified: result.user.identifyVerifiedAt ? true : false,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
```

## 🗃️ **Database Migration Strategy**

### For Existing Nafath Users

```typescript
// Migration script to map existing users to new schema
async function migrateNafathUsers() {
  const nafathUsers = await prisma.user.findMany({
    where: {
      // Find users created via Nafath (you may have a flag for this)
      oauthConnections: {
        some: { provider: "nafath" },
      },
    },
  });

  for (const user of nafathUsers) {
    // Extract national ID from existing data if available
    const nationalId = extractNationalIdFromExistingData(user);

    if (nationalId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          identify: nationalId,
          identifyVerifiedAt: user.verifiedAt,
          role: user.role === "admin" ? 1 : 0, // Convert string to number
          type: 0, // Regular user
        },
      });
    }
  }
}
```

## 🔧 **Configuration Updates**

### Environment Variables

```bash
# Add Nafath-specific configuration
NAFATH_CLIENT_ID=your_nafath_client_id
NAFATH_CLIENT_SECRET=your_nafath_client_secret
NAFATH_ENVIRONMENT=development
NAFATH_API_URL=https://api.nafath.gov.sa

# JWT configuration for new payload structure
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### Nafath Configuration Service

```typescript
@Injectable()
export class NafathConfigService {
  constructor(private configService: ConfigService) {}

  get clientId(): string {
    return this.configService.get<string>("NAFATH_CLIENT_ID");
  }

  get clientSecret(): string {
    return this.configService.get<string>("NAFATH_CLIENT_SECRET");
  }

  get environment(): string {
    return this.configService.get<string>("NAFATH_ENVIRONMENT", "development");
  }

  get apiUrl(): string {
    return this.configService.get<string>("NAFATH_API_URL");
  }

  get webhookSecret(): string {
    return this.configService.get<string>("NAFATH_WEBHOOK_SECRET");
  }
}
```

## 🧪 **Testing Updates**

### Unit Tests for New Schema

```typescript
describe("NafathService with New Schema", () => {
  it("should create user with national ID", async () => {
    const mockNafathProfile = {
      nationalId: "1234567890",
      fullNameEn: "Ahmed Ali",
      fullNameAr: "أحمد علي",
      nationality: "SA",
      dateOfBirth: new Date("1990-01-01"),
    };

    const user = await service.createUserFromNafathProfile(mockNafathProfile);

    expect(user.identify).toBe("1234567890");
    expect(user.name).toBe("Ahmed Ali");
    expect(user.nameAr).toBe("أحمد علي");
    expect(user.identifyVerifiedAt).toBeDefined();
    expect(typeof user.id).toBe("bigint");
  });
});
```

### Integration Tests

```typescript
describe("Nafath Authentication Flow", () => {
  it("should authenticate user and return proper tokens", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/nafath/verify")
      .send({ transactionId: "test-transaction-id" })
      .expect(200);

    expect(response.body.user.id).toBeDefined();
    expect(response.body.user.identify).toBeDefined();
    expect(response.body.accessToken).toBeDefined();

    // Verify JWT payload structure
    const decodedToken = jwt.decode(response.body.accessToken);
    expect(decodedToken.sub).toBeDefined();
    expect(decodedToken.identify).toBeDefined();
  });
});
```

## 📋 **Implementation Checklist**

### Service Layer Updates

- [ ] Update NafathService.createUserFromProfile()
- [ ] Update AuthService.handleNafathCallback()
- [ ] Update AuthService.generateTokens()
- [ ] Update JwtStrategy.validate()
- [ ] Update AuthGuard user validation

### Database Layer Updates

- [ ] Update User DTOs/interfaces
- [ ] Update repository methods for BigInt IDs
- [ ] Create migration script for existing data
- [ ] Update seed data for testing

### API Layer Updates

- [ ] Update controller response serialization
- [ ] Update Swagger documentation
- [ ] Update validation pipes for new fields
- [ ] Test all Nafath endpoints

### Frontend Integration Updates

- [ ] Update API client for new response structure
- [ ] Update user profile components
- [ ] Update authentication state management
- [ ] Test Nafath login flow end-to-end

## 🚀 **Deployment Strategy**

### Development

1. Apply database migration
2. Update service code
3. Run comprehensive tests
4. Verify Nafath integration works

### Production

1. Backup database
2. Apply migration during maintenance window
3. Deploy updated application code
4. Run data migration script for existing users
5. Monitor authentication flows
6. Verify Nafath integration in production

The new Prisma schema provides a much more robust foundation for the Nafath SSO integration with proper field mappings, better data types, and comprehensive relationship management.
