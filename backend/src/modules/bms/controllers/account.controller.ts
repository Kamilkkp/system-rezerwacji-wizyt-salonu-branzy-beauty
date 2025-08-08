import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from '../../core/account/account.service';
import { UpdateAccountDto } from '../../core/account/dto/update-account.dto';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';

@ApiTags('BMS Account')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  findOne(@AuthUser() user: UserPayload) {
    return this.accountService.findOne(user.id);
  }

  @Patch()
  update(
    @AuthUser() user: UserPayload,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountService.update(user.id, updateAccountDto);
  }

  @Delete()
  remove(@AuthUser() user: UserPayload) {
    return this.accountService.remove(user.id);
  }
}
