import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
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

@Injectable()
export class NafathStrategy extends PassportStrategy(Strategy, "nafath") {
  private readonly nafathBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    super();
    this.nafathBaseUrl = this.configService.get("NAFATH_BASE_URL");
    this.clientId = this.configService.get("NAFATH_CLIENT_ID");
    this.clientSecret = this.configService.get("NAFATH_CLIENT_SECRET");
    this.callbackSecret = this.configService.get("NAFATH_CALLBACK_SECRET");
  }

  // Required by PassportStrategy for custom strategy
  async validate(req: Request): Promise<any> {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }

      // Verify the transaction with Nafath
      const profile = await this.verifyTransaction(transactionId);

      if (!profile) {
        throw new Error("Invalid or expired transaction");
      }

      const user = {
        providerId: profile.nationalId,
        nationalId: profile.nationalId,
        fullNameAr: profile.fullNameAr,
        fullNameEn: profile.fullNameEn,
        dateOfBirth: profile.dateOfBirth,
        nationality: profile.nationality,
        mobile: profile.mobile,
        email: profile.email || `${profile.nationalId}@nafath.sa`,
        provider: "nafath",
        transactionId: profile.transactionId,
      };

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initiate Nafath authentication
   */
  async initiateAuth(
    nationalId: string,
    channel: "PUSH" | "QR" = "PUSH"
  ): Promise<{
    transactionId: string;
    qrCode?: string;
    expiresIn: number;
  }> {
    try {
      // TODO: Replace with actual Nafath API call
      // For now, return mock data
      const transactionId = this.generateTransactionId();

      // In production, this would be an HTTP call to Nafath API:
      /*
      const response = await firstValueFrom(
        this.httpService.post(`${this.nafathBaseUrl}/api/v1/authenticate`, {
          client_id: this.clientId,
          national_id: nationalId,
          channel: channel,
          callback_url: `${process.env.APP_URL}/auth/nafath/callback`,
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
      throw new Error(
        `Failed to initiate Nafath authentication: ${error.message}`
      );
    }
  }

  /**
   * Check the status of a Nafath transaction
   */
  async checkTransactionStatus(transactionId: string): Promise<{
    status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
    profile?: NafathProfile;
  }> {
    try {
      // TODO: Replace with actual Nafath API call
      // For now, return mock data based on transaction ID pattern

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

      // Mock response - approve transactions ending with 'approved'
      if (transactionId.endsWith("approved")) {
        return {
          status: "APPROVED",
          profile: {
            nationalId: "1234567890",
            fullNameAr: "محمد أحمد السالم",
            fullNameEn: "Mohammed Ahmed Al-Salem",
            dateOfBirth: "1990-01-15",
            nationality: "SA",
            mobile: "+966501234567",
            transactionId,
          },
        };
      } else if (transactionId.endsWith("rejected")) {
        return { status: "REJECTED" };
      } else if (transactionId.endsWith("expired")) {
        return { status: "EXPIRED" };
      } else {
        return { status: "PENDING" };
      }
    } catch (error) {
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

  private async verifyTransaction(
    transactionId: string
  ): Promise<NafathProfile | null> {
    const result = await this.checkTransactionStatus(transactionId);

    if (result.status === "APPROVED" && result.profile) {
      return result.profile;
    }

    return null;
  }

  private generateTransactionId(): string {
    return `nafath_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  private generateMockQR(transactionId: string): string {
    // In production, this would be the actual QR code from Nafath
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }
}
