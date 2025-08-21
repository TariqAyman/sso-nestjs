import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { User } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(payload: any): Promise<User> {
    return this.userService.findOne(payload.sub);
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string } | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.userService.validatePassword(
      user,
      password
    );
    if (!isPasswordValid) {
      return null;
    }

    const token = await this.generateToken(user);
    return { user, token };
  }
}
