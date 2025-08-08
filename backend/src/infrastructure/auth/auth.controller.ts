import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { TokensDto } from './dto/tokens.dto';
import { LocalAuthGuard } from '@root/libs/guards/local-auth.guard';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from '@root/libs/guards/jwt-refresh-auth.guard';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('BMS Auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Body() payload: LoginDto,
    @AuthUser() user: UserPayload,
  ): Promise<TokensDto> {
    return this.authService.login(user);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiBearerAuth()
  async refreshTokens(
    @Body() payload: RefreshTokenDto,
    @AuthUser() user: UserPayload,
  ): Promise<TokensDto> {
    return this.authService.refreshTokens(user, payload.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  async logout(@AuthUser() user: UserPayload) {
    await this.authService.logout(user.id);
  }
}
