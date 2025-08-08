import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { CreateOpenHoursExceptionDto } from '@root/modules/core/salons/dto/req/create-open-hours-exception.dto';
import { FindOpenHoursExceptionsQueryDto } from '@root/modules/core/salons/dto/req/find-open-hours-exceptions.query.dto';
import { UpdateOpenHoursExceptionDto } from '@root/modules/core/salons/dto/req/update-open-hours-exception.dto';
import { OpenHoursExceptionsService } from '@root/modules/core/salons/open-hours-exceptions.service';
import { UUID } from 'crypto';

@ApiTags('BMS Salon Open-hours-exceptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/salons/:salonId/open-hours/exceptions')
export class OpenHoursExceptionsController {
  constructor(
    private readonly openHoursExceptionsService: OpenHoursExceptionsService,
  ) {}

  @Post()
  async create(
    @AuthUser() user: UserPayload,
    @Param('salonId', ParseUUIDPipe) salonId: UUID,
    @Body() createDto: CreateOpenHoursExceptionDto,
  ) {
    return this.openHoursExceptionsService.create(user.id, salonId, createDto);
  }

  @Get()
  async findAll(
    @AuthUser() user: UserPayload,
    @Param('salonId', ParseUUIDPipe) salonId: UUID,
    @Query() query: FindOpenHoursExceptionsQueryDto,
  ) {
    return this.openHoursExceptionsService.findAll(
      user.id,
      salonId,
      query.startDate,
      query.endDate,
    );
  }

  @Patch(':id')
  async update(
    @AuthUser() user: UserPayload,
    @Param('salonId', ParseUUIDPipe) salonId: UUID,
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body() updateDto: UpdateOpenHoursExceptionDto,
  ) {
    return this.openHoursExceptionsService.update(
      user.id,
      salonId,
      id,
      updateDto,
    );
  }

  @Delete(':id')
  async remove(
    @AuthUser() user: UserPayload,
    @Param('salonId', ParseUUIDPipe) salonId: UUID,
    @Param('id', ParseUUIDPipe) id: UUID,
  ) {
    await this.openHoursExceptionsService.remove(user.id, salonId, id);
  }
}
