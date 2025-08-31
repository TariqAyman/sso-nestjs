import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-twitter";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, "twitter") {
  constructor(private configService: ConfigService) {
    super({
      consumerKey: configService.get("TWITTER_CONSUMER_KEY"),
      consumerSecret: configService.get("TWITTER_CONSUMER_SECRET"),
      callbackURL: "/api/v1/auth/twitter/callback",
      includeEmail: true,
    });
  }

  async validate(
    token: string,
    tokenSecret: string,
    profile: any
  ): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    const user = {
      providerId: id,
      email: emails?.[0]?.value || "",
      name: displayName || username,
      avatar: photos?.[0]?.value || "",
      provider: "twitter",
      accessToken: token,
      refreshToken: tokenSecret,
    };

    return user;
  }
}
