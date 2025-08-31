import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-facebook";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get("FACEBOOK_CLIENT_ID"),
      clientSecret: configService.get("FACEBOOK_CLIENT_SECRET"),
      callbackURL: "/api/v1/auth/facebook/callback",
      scope: ["email"],
      profileFields: ["emails", "name", "picture"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      providerId: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      avatar: photos[0].value,
      provider: "facebook",
      accessToken,
      refreshToken,
    };

    return user;
  }
}
