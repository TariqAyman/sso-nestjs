import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { LoggingConfig, LogLevel } from "../config/logging.config";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("RequestLogger");

  constructor(private readonly loggingConfig: LoggingConfig) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Skip logging if not enabled
    if (!this.loggingConfig.enableRequestLogging) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract request information
    const { method, url, headers, body, query, params, ip } = request;

    // Get user information if available
    const user = (request as any).user;
    const userId = user?.id || "anonymous";
    const userEmail = user?.email || "N/A";

    // Log request details based on logging level
    if (
      this.loggingConfig.shouldLog(LogLevel.DEBUG) &&
      this.loggingConfig.enableDetailedLogging
    ) {
      this.logger.log(`
🔄 === INCOMING REQUEST ===
📋 Method: ${method}
🔗 URL: ${url}
🌐 IP: ${ip || request.connection?.remoteAddress}
👤 User: ${userId} (${userEmail})
📄 Headers: ${JSON.stringify(this.sanitizeHeaders(headers), null, 2)}
🔍 Query: ${JSON.stringify(query, null, 2)}
⚙️  Params: ${JSON.stringify(params, null, 2)}
📦 Body: ${JSON.stringify(this.sanitizeBody(body), null, 2)}
⏰ Timestamp: ${new Date().toISOString()}
========================`);
    } else if (this.loggingConfig.shouldLog(LogLevel.INFO)) {
      this.logger.log(
        `🔄 ${method} ${url} - User: ${userId} - ${new Date().toISOString()}`
      );
    }

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          if (
            this.loggingConfig.shouldLog(LogLevel.DEBUG) &&
            this.loggingConfig.enableDetailedLogging
          ) {
            this.logger.log(`
✅ === RESPONSE SUCCESS ===
📋 Method: ${method}
🔗 URL: ${url}
👤 User: ${userId}
📊 Status: ${response.statusCode}
⏱️  Duration: ${duration}ms
📦 Response: ${JSON.stringify(this.sanitizeResponse(responseData), null, 2)}
⏰ Completed: ${new Date().toISOString()}
===========================`);
          } else if (this.loggingConfig.shouldLog(LogLevel.INFO)) {
            this.logger.log(
              `✅ ${method} ${url} - ${response.statusCode} - ${duration}ms`
            );
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          if (this.loggingConfig.shouldLog(LogLevel.ERROR)) {
            this.logger.error(`
❌ === RESPONSE ERROR ===
📋 Method: ${method}
🔗 URL: ${url}
👤 User: ${userId}
📊 Status: ${response.statusCode || 500}
⏱️  Duration: ${duration}ms
🚨 Error: ${error.message}
📚 Stack: ${error.stack}
⏰ Failed: ${new Date().toISOString()}
========================`);
          }
        },
      })
    );
  }

  private sanitizeHeaders(headers: any): any {
    if (this.loggingConfig.logSensitiveData) {
      return headers;
    }

    const sanitized = { ...headers };

    // Remove sensitive headers
    const sensitiveHeaders = [
      "authorization",
      "cookie",
      "x-api-key",
      "x-auth-token",
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (this.loggingConfig.logSensitiveData) {
      return body;
    }

    if (!body || typeof body !== "object") {
      return body;
    }

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = [
      "password",
      "currentPassword",
      "newPassword",
      "confirmPassword",
      "clientSecret",
      "secret",
      "token",
      "refreshToken",
      "accessToken",
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private sanitizeResponse(response: any): any {
    if (this.loggingConfig.logSensitiveData) {
      return response;
    }

    if (!response || typeof response !== "object") {
      return response;
    }

    const sanitized = { ...response };

    // Remove sensitive response fields
    const sensitiveFields = [
      "password",
      "clientSecret",
      "accessToken",
      "refreshToken",
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });

    // If response has nested user object, sanitize it too
    if (sanitized.user && typeof sanitized.user === "object") {
      sanitized.user = this.sanitizeResponse(sanitized.user);
    }

    return sanitized;
  }
}
