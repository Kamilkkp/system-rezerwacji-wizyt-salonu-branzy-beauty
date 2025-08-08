import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { MailingSystemService } from '../../core/mailing-system/mailing-system.service';
import { SendEmailMessageDto } from '../../core/mailing-system/dto/send-email-message.dto';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { UUID } from 'crypto';

@ApiTags('BMS Salons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/salons/:salonId/mailing-system')
export class MailingSystemController {
  constructor(private readonly mailingSystemService: MailingSystemService) {}

  @Post()
  create(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Body() payload: SendEmailMessageDto,
  ) {
    return this.mailingSystemService.sendMessage(user.id, salonId, payload);
  }
}
