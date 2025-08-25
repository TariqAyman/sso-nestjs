import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CryptoService {
  constructor(private configService: ConfigService) {}

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get("BCRYPT_SALT_ROUNDS", 12);
    return bcrypt.hash(password, parseInt(saltRounds));
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate cryptographically secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate UUID v4
   */
  generateUuid(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate client ID for SSO applications
   */
  generateClientId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(16).toString("hex");
    return `${timestamp}_${randomPart}`;
  }

  /**
   * Generate client secret for SSO applications
   */
  generateClientSecret(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  /**
   * Generate OTP code
   */
  generateOtp(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const key = this.configService.get("ENCRYPTION_KEY");
    if (!key) {
      throw new Error("ENCRYPTION_KEY not configured");
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher("aes-256-gcm", key);
    cipher.setAAD(Buffer.from("additional-data"));

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const key = this.configService.get("ENCRYPTION_KEY");
    if (!key) {
      throw new Error("ENCRYPTION_KEY not configured");
    }

    const decipher = crypto.createDecipher("aes-256-gcm", key);
    decipher.setAAD(Buffer.from("additional-data"));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Create HMAC signature
   */
  createHmacSignature(data: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  /**
   * Verify HMAC signature
   */
  verifyHmacSignature(
    data: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.createHmacSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
