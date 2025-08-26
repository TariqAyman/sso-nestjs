import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import * as crypto from "crypto";

export interface NafathProfile {
  nationalId: string;
  fullNameAr?: string;
  fullNameEn?: string;
  dateOfBirth?: string;
  nationality?: string;
  mobile?: string;
  email?: string;
  transactionId: string;
}

export interface NafathInitiateResponse {
  transactionId: string;
  qrCode?: string;
  expiresIn: number;
}

export interface NafathStatusResponse {
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  profile?: NafathProfile;
}

@Injectable()
export class NafathService {
  private readonly nafathBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    this.nafathBaseUrl = this.configService.get(
      "NAFATH_BASE_URL",
      "https://nafath.example.com"
    );
    this.clientId = this.configService.get(
      "NAFATH_CLIENT_ID",
      "demo-client-id"
    );
    this.clientSecret = this.configService.get(
      "NAFATH_CLIENT_SECRET",
      "demo-client-secret"
    );
    this.callbackSecret = this.configService.get(
      "NAFATH_CALLBACK_SECRET",
      "demo-callback-secret"
    );
  }

  /**
   * Initiate Nafath authentication
   */
  async initiateAuth(
    nationalId: string,
    channel: "PUSH" | "QR" = "PUSH"
  ): Promise<NafathInitiateResponse> {
    try {
      // Validate national ID format (Saudi/Iqama format)
      if (!this.isValidNationalId(nationalId)) {
        throw new BadRequestException("Invalid national ID format");
      }

      // TODO: Replace with actual Nafath API call
      // For now, return mock data for development
      const transactionId = this.generateTransactionId();

      // In production, this would be an HTTP call to Nafath API:
      /*
      const response = await firstValueFrom(
        this.httpService.post(`${this.nafathBaseUrl}/api/v1/authenticate`, {
          client_id: this.clientId,
          national_id: nationalId,
          channel: channel,
          callback_url: `${this.configService.get('APP_URL', 'http://localhost:3000')}/api/auth/nafath/callback`,
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
      */

      // Mock response for development
      return {
        transactionId,
        qrCode:
          channel === "QR" ? this.generateMockQR(transactionId) : undefined,
        expiresIn: 300, // 5 minutes
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(
        `Failed to initiate Nafath authentication: ${error.message}`
      );
    }
  }

  /**
   * Check the status of a Nafath transaction
   */
  async checkTransactionStatus(
    transactionId: string
  ): Promise<NafathStatusResponse> {
    try {
      if (!transactionId) {
        throw new BadRequestException("Transaction ID is required");
      }

      // TODO: Replace with actual Nafath API call
      /*
      const response = await firstValueFrom(
        this.httpService.get(`${this.nafathBaseUrl}/api/v1/transaction/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${this.clientSecret}`,
          }
        })
      );
      
      return {
        status: response.data.status,
        profile: response.data.profile
      };
      */

      // Mock response for development
      return this.getMockTransactionStatus(transactionId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to check transaction status: ${error.message}`);
    }
  }

  /**
   * Verify callback signature from Nafath
   */
  verifyCallbackSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.callbackSecret)
        .update(payload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle Nafath callback
   */
  async handleCallback(
    payload: any,
    signature?: string
  ): Promise<NafathProfile> {
    try {
      // Verify signature if provided
      if (
        signature &&
        !this.verifyCallbackSignature(JSON.stringify(payload), signature)
      ) {
        throw new UnauthorizedException("Invalid callback signature");
      }

      // Validate payload structure
      if (!payload.transactionId || !payload.status) {
        throw new BadRequestException("Invalid callback payload");
      }

      if (payload.status !== "APPROVED") {
        throw new UnauthorizedException(
          `Authentication ${payload.status.toLowerCase()}`
        );
      }

      // Return the user profile from callback
      return {
        nationalId: payload.nationalId,
        fullNameAr: payload.fullNameAr,
        fullNameEn: payload.fullNameEn,
        dateOfBirth: payload.dateOfBirth,
        nationality: payload.nationality,
        mobile: payload.mobile,
        email: payload.email,
        transactionId: payload.transactionId,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new Error(`Failed to handle callback: ${error.message}`);
    }
  }

  /**
   * Validate National ID format (Saudi Arabia / Iqama)
   */
  private isValidNationalId(nationalId: string): boolean {
    // Saudi National ID: 10 digits, starts with 1 (Saudi) or 2 (Iqama)
    const regex = /^[12]\d{9}$/;
    return regex.test(nationalId);
  }

  private generateTransactionId(): string {
    return `nafath_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  private generateMockQR(transactionId: string): string {
    // In production, this would be the actual QR code from Nafath
    // For now, return a simple base64 QR code placeholder
    return `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" fill="black" font-size="12">
          Nafath QR Code
        </text>
        <text x="100" y="120" text-anchor="middle" fill="gray" font-size="8">
          ${transactionId.substring(0, 20)}...
        </text>
      </svg>
    `
    ).toString("base64")}`;
  }

  private getMockTransactionStatus(
    transactionId: string
  ): NafathStatusResponse {
    // Mock different statuses based on transaction ID patterns for testing
    if (transactionId.includes("approved") || transactionId.endsWith("1")) {
      return {
        status: "APPROVED",
        profile: {
          nationalId: "1234567890",
          fullNameAr: "محمد أحمد السالم",
          fullNameEn: "Mohammed Ahmed Al-Salem",
          dateOfBirth: "1990-01-15",
          nationality: "SA",
          mobile: "+966501234567",
          email: "mohammed.salem@example.com",
          transactionId,
        },
      };
    } else if (
      transactionId.includes("rejected") ||
      transactionId.endsWith("2")
    ) {
      return { status: "REJECTED" };
    } else if (
      transactionId.includes("expired") ||
      transactionId.endsWith("3")
    ) {
      return { status: "EXPIRED" };
    } else {
      return { status: "PENDING" };
    }
  }
}
