import { Injectable } from "@nestjs/common";
import { validate as validateUuid } from "uuid";

@Injectable()
export class ValidatorService {
  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate password strength
   */
  isValidPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    // Check for common passwords
    const commonPasswords = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("Password is too common");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate UUID
   */
  isValidUuid(uuid: string): boolean {
    return validateUuid(uuid);
  }

  /**
   * Validate client ID format
   */
  isValidClientId(clientId: string): boolean {
    // Client ID should be alphanumeric with underscores, 16-64 characters
    const regex = /^[a-zA-Z0-9_]{16,64}$/;
    return regex.test(clientId);
  }

  /**
   * Validate redirect URI
   */
  isValidRedirectUri(uri: string, allowedOrigins?: string[]): boolean {
    if (!this.isValidUrl(uri)) {
      return false;
    }

    const url = new URL(uri);

    // Must use HTTPS in production (except localhost)
    if (process.env.NODE_ENV === "production") {
      if (url.protocol !== "https:" && url.hostname !== "localhost") {
        return false;
      }
    }

    // Check against allowed origins if provided
    if (allowedOrigins && allowedOrigins.length > 0) {
      const origin = `${url.protocol}//${url.host}`;
      return allowedOrigins.includes(origin);
    }

    return true;
  }

  /**
   * Validate scope string
   */
  isValidScope(scope: string): boolean {
    if (!scope || scope.trim().length === 0) {
      return false;
    }

    // Valid scopes: read, write, admin, profile, email
    const validScopes = ["read", "write", "admin", "profile", "email"];
    const requestedScopes = scope.split(" ").map((s) => s.trim());

    return requestedScopes.every((s) => validScopes.includes(s));
  }

  /**
   * Validate phone number (basic validation)
   */
  isValidPhoneNumber(phone: string): boolean {
    // Basic international phone number validation
    const regex = /^\+?[1-9]\d{1,14}$/;
    return regex.test(phone.replace(/[\s\-\(\)]/g, ""));
  }

  /**
   * Validate application name
   */
  isValidApplicationName(name: string): boolean {
    // 3-50 characters, alphanumeric, spaces, hyphens, underscores
    const regex = /^[a-zA-Z0-9\s\-_]{3,50}$/;
    return regex.test(name);
  }

  /**
   * Validate hex color code
   */
  isValidHexColor(color: string): boolean {
    const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return regex.test(color);
  }

  /**
   * Validate JSON string
   */
  isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate timezone
   */
  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate language code (ISO 639-1)
   */
  isValidLanguageCode(code: string): boolean {
    const validCodes = [
      "en",
      "es",
      "fr",
      "de",
      "it",
      "pt",
      "ru",
      "ja",
      "ko",
      "zh",
      "ar",
      "hi",
      "nl",
      "sv",
      "no",
      "da",
      "fi",
      "pl",
      "tr",
      "he",
    ];
    return validCodes.includes(code.toLowerCase());
  }

  /**
   * Sanitize string for database storage
   */
  sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  }

  /**
   * Validate IP address
   */
  isValidIpAddress(ip: string): boolean {
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Validate user agent string
   */
  isValidUserAgent(userAgent: string): boolean {
    // Basic validation - should contain browser/version info
    const regex = /^[a-zA-Z0-9\s\(\)\.\-\/;,:_]+$/;
    return regex.test(userAgent) && userAgent.length <= 500;
  }
}
