import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const emailConfig = {
      host: this.configService.get("SMTP_HOST"),
      port: this.configService.get("SMTP_PORT", 587),
      secure: this.configService.get("SMTP_SECURE", false),
      auth: {
        user: this.configService.get("SMTP_USER"),
        pass: this.configService.get("SMTP_PASS"),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get("MAIL_FROM", "noreply@opensso.com"),
        to: options.to,
        subject: options.subject,
        html:
          options.html ||
          this.getEmailTemplate(options.template, options.context),
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${options.to}. Message ID: ${result.messageId}`
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  async sendActivationEmail(
    email: string,
    token: string,
    userName: string
  ): Promise<boolean> {
    const activationUrl = `${this.configService.get("FRONTEND_URL")}/activate?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: "Activate Your Account - Open SSO",
      template: "activation",
      context: {
        userName,
        activationUrl,
        supportEmail: this.configService.get(
          "SUPPORT_EMAIL",
          "support@opensso.com"
        ),
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    userName: string
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get("FRONTEND_URL")}/reset-password?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: "Reset Your Password - Open SSO",
      template: "password-reset",
      context: {
        userName,
        resetUrl,
        supportEmail: this.configService.get(
          "SUPPORT_EMAIL",
          "support@opensso.com"
        ),
      },
    });
  }

  async sendOtpEmail(
    email: string,
    otp: string,
    userName: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Your OTP Code - Open SSO",
      template: "otp",
      context: {
        userName,
        otp,
        expirationMinutes: this.configService.get("OTP_EXPIRATION_MINUTES", 10),
      },
    });
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Welcome to Open SSO",
      template: "welcome",
      context: {
        userName,
        dashboardUrl: `${this.configService.get("FRONTEND_URL")}/dashboard`,
        supportEmail: this.configService.get(
          "SUPPORT_EMAIL",
          "support@opensso.com"
        ),
      },
    });
  }

  async sendSecurityAlertEmail(
    email: string,
    userName: string,
    event: string,
    details: Record<string, any>
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: "Security Alert - Open SSO",
      template: "security-alert",
      context: {
        userName,
        event,
        details,
        timestamp: new Date().toISOString(),
        supportEmail: this.configService.get(
          "SUPPORT_EMAIL",
          "support@opensso.com"
        ),
      },
    });
  }

  private getEmailTemplate(
    template: string,
    context: Record<string, any> = {}
  ): string {
    // Basic email templates - in production, you'd want to use a proper template engine
    const templates = {
      activation: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Open SSO!</h2>
          <p>Hello ${context.userName},</p>
          <p>Thank you for registering with Open SSO. Please click the button below to activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.activationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Activate Account
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${context.activationUrl}">${context.activationUrl}</a></p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr>
          <p><small>Best regards,<br>The Open SSO Team<br>Need help? Contact us at ${context.supportEmail}</small></p>
        </div>
      `,
      "password-reset": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${context.userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${context.resetUrl}">${context.resetUrl}</a></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr>
          <p><small>Best regards,<br>The Open SSO Team<br>Need help? Contact us at ${context.supportEmail}</small></p>
        </div>
      `,
      otp: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your OTP Code</h2>
          <p>Hello ${context.userName},</p>
          <p>Your one-time password (OTP) code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
              ${context.otp}
            </div>
          </div>
          <p>This code will expire in ${context.expirationMinutes} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr>
          <p><small>Best regards,<br>The Open SSO Team</small></p>
        </div>
      `,
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Open SSO!</h2>
          <p>Hello ${context.userName},</p>
          <p>Your account has been successfully activated. You can now access your dashboard and start managing your SSO applications.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.dashboardUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <hr>
          <p><small>Best regards,<br>The Open SSO Team<br>Need help? Contact us at ${context.supportEmail}</small></p>
        </div>
      `,
      "security-alert": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Security Alert</h2>
          <p>Hello ${context.userName},</p>
          <p>We detected the following security event on your account:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <strong>Event:</strong> ${context.event}<br>
            <strong>Time:</strong> ${context.timestamp}<br>
            ${Object.entries(context.details)
              .map(([key, value]) => `<strong>${key}:</strong> ${value}<br>`)
              .join("")}
          </div>
          <p>If this was you, you can safely ignore this email. If you didn't perform this action, please secure your account immediately.</p>
          <hr>
          <p><small>Best regards,<br>The Open SSO Team<br>Need help? Contact us at ${context.supportEmail}</small></p>
        </div>
      `,
    };

    return templates[template] || `<p>Template ${template} not found</p>`;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log("Email service connection verified");
      return true;
    } catch (error) {
      this.logger.error("Email service connection failed", error);
      return false;
    }
  }
}
