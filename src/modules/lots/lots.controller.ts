import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { Lot } from './entities/lot.entity';

@ApiTags('Lots')
@Controller('appels-offres/:aoId/lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  @ApiOperation({ summary: "Créer un lot pour un Appel d'Offres" })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({ status: 201, type: Lot })
  create(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Body() createLotDto: CreateLotDto,
  ) {
    return this.lotsService.create(aoId, createLotDto);
  }

  @Get()
  @ApiOperation({ summary: "Lister tous les lots d'un Appel d'Offres" })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({ status: 200, type: [Lot] })
  findAll(@Param('aoId', ParseUUIDPipe) aoId: string) {
    return this.lotsService.findAll(aoId);
  }
}
