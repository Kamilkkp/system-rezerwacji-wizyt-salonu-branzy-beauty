import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from '../../config/jwt.config.service';
import * as bcrypt from 'bcrypt';
import { TokensDto } from './dto/tokens.dto';
import { LoginDto } from './dto/login.dto';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { InjectTransaction, Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { createHash, UUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectTransaction()
    private readonly db: Transaction<TransactionalAdapterPrisma>,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
  ) {}

  async validateUser({
    email,
    password,
  }: LoginDto): Promise<UserPayload | null> {
    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      return { id: user.id as UUID, email };
    }

    return null;
  }

  async login(payload: UserPayload): Promise<TokensDto> {
    const tokens = await this.getTokens(payload);

    await this.updateUserRefreshToken(payload.id, tokens.refresh_token);
    return tokens;
  }

  async getTokens({ id, email }: UserPayload): Promise<TokensDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: id, email },
        {
          secret: this.jwtConfigService.jwtSecret,
          expiresIn: this.jwtConfigService.jwtExpirationTime,
        },
      ),
      this.jwtService.signAsync(
        { sub: id, email },
        {
          secret: this.jwtConfigService.jwtRefreshSecret,
          expiresIn: this.jwtConfigService.jwtRefreshExpirationTime,
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.updateUserRefreshToken(userId, null);
  }

  async refreshTokens(
    userPayload: UserPayload,
    refreshToken: string,
  ): Promise<TokensDto> {
    const user = await this.db.user.findUnique({
      where: { id: userPayload.id },
      select: { refreshTokenHash: true },
    });
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException(
        'Access Denied: No active session or user not found',
      );
    }
    const isRefreshTokenMatches =
      createHash('sha256').update(refreshToken).digest('hex') ==
      user.refreshTokenHash;

    if (!isRefreshTokenMatches) {
      await this.updateUserRefreshToken(userPayload.id, null);

      throw new ForbiddenException('Access Denied: Invalid refresh token');
    }

    const newTokens = await this.getTokens(userPayload);
    await this.updateUserRefreshToken(userPayload.id, newTokens.refresh_token);

    return newTokens;
  }

  private async updateUserRefreshToken(
    userId: string,
    refreshToken: string | null,
  ) {
    const refreshTokenHash = refreshToken
      ? createHash('sha256').update(refreshToken).digest('hex')
      : null;

    await this.db.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }
}
