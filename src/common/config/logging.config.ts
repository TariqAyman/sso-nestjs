import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5,
}

@Injectable()
export class LoggingConfig {
  constructor(private configService: ConfigService) {}

  get logLevel(): LogLevel {
    const level = this.configService.get("LOG_LEVEL", "INFO").toUpperCase();
    return LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  get enableRequestLogging(): boolean {
    return this.configService.get("ENABLE_REQUEST_LOGGING", "true") === "true";
  }

  get enableDetailedLogging(): boolean {
    return this.configService.get("ENABLE_DETAILED_LOGGING", "true") === "true";
  }

  get logSensitiveData(): boolean {
    return this.configService.get("LOG_SENSITIVE_DATA", "false") === "true";
  }

  shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }
}
