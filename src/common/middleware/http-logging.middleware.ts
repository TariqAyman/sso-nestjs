import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HttpLogger");

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;

    // Get user agent
    const userAgent = req.get("User-Agent") || "";

    // Log basic request info
    this.logger.log(`🌐 ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // Override res.end to log response
    const originalEnd = res.end.bind(res);
    res.end = (chunk?: any, encoding?: any, cb?: any) => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Color coding for status codes
      let statusEmoji = "✅";
      if (statusCode >= 400 && statusCode < 500) {
        statusEmoji = "⚠️";
      } else if (statusCode >= 500) {
        statusEmoji = "❌";
      }

      const logger = new Logger("HttpLogger");
      logger.log(
        `${statusEmoji} ${method} ${originalUrl} - ${statusCode} - ${duration}ms`
      );

      return originalEnd(chunk, encoding, cb);
    };

    next();
  }
}
