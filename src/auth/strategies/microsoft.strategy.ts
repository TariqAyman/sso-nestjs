import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-microsoft";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, "microsoft") {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get("MICROSOFT_CLIENT_ID"),
      clientSecret: configService.get("MICROSOFT_CLIENT_SECRET"),
      callbackURL: "/api/v1/auth/microsoft/callback",
      scope: ["user.read"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    const user = {
      providerId: id,
      email: emails[0].value,
      name: displayName,
      avatar: photos?.[0]?.value || "",
      provider: "microsoft",
      accessToken,
      refreshToken,
    };

    return user;
  }
}
