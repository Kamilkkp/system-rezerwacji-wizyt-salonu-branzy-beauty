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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ServiceStatus } from '@prisma/client';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { CreateServiceDto } from '@root/modules/core/services/dto/create-service.dto';
import { UpdateServiceDto } from '@root/modules/core/services/dto/update-service.dto';
import { ServicesService } from '@root/modules/core/services/services.service';
import { UUID } from 'crypto';

@ApiTags('BMS Services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/salons/:salonId/service-groups/:serviceGroupId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('serviceGroupId') serviceGroupId: UUID,
    @Body() createServiceDto: CreateServiceDto,
  ) {
    return this.servicesService.create(
      user.id,
      salonId,
      serviceGroupId,
      createServiceDto,
    );
  }

  @Get()
  findAll(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('serviceGroupId') serviceGroupId: UUID,
    @Query('status') status?: ServiceStatus,
  ) {
    return this.servicesService.findAll(user.id, serviceGroupId, status);
  }

  @Get(':id')
  findOne(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('serviceGroupId') serviceGroupId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('serviceGroupId') serviceGroupId: UUID,
    @Param('id') id: UUID,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(
      user.id,
      salonId,
      serviceGroupId,
      id,
      updateServiceDto,
    );
  }

  @Delete(':id')
  remove(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('serviceGroupId') serviceGroupId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.servicesService.remove(user.id, salonId, serviceGroupId, id);
  }
}
