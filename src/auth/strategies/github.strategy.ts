import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-github2";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get("GITHUB_CLIENT_ID"),
      clientSecret: configService.get("GITHUB_CLIENT_SECRET"),
      callbackURL: "/api/v1/auth/github/callback",
      scope: ["user:email"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    const user = {
      providerId: id,
      email: emails[0].value,
      name: displayName || username,
      avatar: photos[0].value,
      provider: "github",
      accessToken,
      refreshToken,
    };

    return user;
  }
}
