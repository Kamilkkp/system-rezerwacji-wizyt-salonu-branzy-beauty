import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      passReqToCallback: true,
      usernameField: 'email',
    });
  }

  async validate(req: Request): Promise<UserPayload> {
    const user = await this.authService.validateUser(req.body as LoginDto);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
