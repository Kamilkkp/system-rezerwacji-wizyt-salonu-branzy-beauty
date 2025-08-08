import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@root/libs/guards/jwt-auth.guard';
import { UUID } from 'crypto';
import { AuthUser } from '@root/libs/decorators/auth-user.decorator';
import { UserPayload } from '@root/libs/interfaces/user-payload.interface';
import { CreateSalonDto } from '@root/modules/core/salons/dto/req/create-salon.dto';
import { SalonsService } from '@root/modules/core/salons/salons.service';
import { UpdateSalonDto } from '@root/modules/core/salons/dto/req/update-salon.dto';

@ApiTags('BMS Salons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bms/salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Post()
  create(
    @AuthUser() user: UserPayload,
    @Body() createSalonDto: CreateSalonDto,
  ) {
    return this.salonsService.create(user.id, createSalonDto);
  }

  @Get()
  findAll(@AuthUser() user: UserPayload) {
    return this.salonsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: UUID) {
    return this.salonsService.findOne(id);
  }

  @Patch(':id')
  update(
    @AuthUser() user: UserPayload,
    @Param('id') id: UUID,
    @Body() updateSalonDto: UpdateSalonDto,
  ) {
    return this.salonsService.update(user.id, id, updateSalonDto);
  }

  @Delete(':id')
  remove(@AuthUser() user: UserPayload, @Param('id') id: UUID) {
    return this.salonsService.remove(user.id, id);
  }
}
