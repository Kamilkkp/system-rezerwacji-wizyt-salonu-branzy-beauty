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
import { ServiceGroupsService } from '../../core/service-groups/service-groups.service';
import { CreateServiceGroupDto } from '../../core/service-groups/dto/req/create-service-group.dto';
import { UpdateServiceGroupDto } from '../../core/service-groups/dto/req/update-service-group.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { UUID } from 'crypto';
import { FindAllServiceGroupsQueryDto } from '@root/modules/core/service-groups/dto/req/find-all-service-groups.query.dto';
import { FindOneServiceGroupsQueryDto } from '@root/modules/core/service-groups/dto/req/find-one-service-groups.query.dto';

@ApiTags('BMS Service Groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/salons/:salonId/service-groups')
export class ServiceGroupsController {
  constructor(private readonly serviceGroupsService: ServiceGroupsService) {}

  @Post()
  create(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Body() createServiceGroupDto: CreateServiceGroupDto,
  ) {
    return this.serviceGroupsService.create(
      user.id,
      salonId,
      createServiceGroupDto,
    );
  }

  @Get()
  findAll(
    @Param('salonId') salonId: UUID,
    @Query() query: FindAllServiceGroupsQueryDto,
  ) {
    return this.serviceGroupsService.findAll(salonId, query.status);
  }

  @Get(':id')
  findOne(
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
    @Query() query: FindOneServiceGroupsQueryDto,
  ) {
    return this.serviceGroupsService.findOne(id, query.status);
  }

  @Patch(':id')
  update(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
    @Body() updateServiceGroupDto: UpdateServiceGroupDto,
  ) {
    return this.serviceGroupsService.update(
      user.id,
      salonId,
      id,
      updateServiceGroupDto,
    );
  }

  @Delete(':id')
  remove(
    @AuthUser() user: UserPayload,
    @Param('salonId') salonId: UUID,
    @Param('id') id: UUID,
  ) {
    return this.serviceGroupsService.remove(user.id, salonId, id);
  }
}
