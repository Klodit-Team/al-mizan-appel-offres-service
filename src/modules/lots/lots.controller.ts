import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';

@ApiTags('Lots')
@Controller('appels-offres/:aoId/lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  /**
   * POST /api/appels-offres/:aoId/lots
   * Crée un nouveau lot pour l'AO spécifié.
   * Règle métier : L'AO doit être au statut BROUILLON.
   */
  @Post()
  @ApiOperation({ summary: "Créer un lot pour un Appel d'Offres" })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  create(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Body() createLotDto: CreateLotDto,
  ) {
    return this.lotsService.create(aoId, createLotDto);
  }

  /**
   * GET /api/appels-offres/:aoId/lots
   * Récupère tous les lots d'un Appel d'Offres.
   */
  @Get()
  @ApiOperation({ summary: "Lister tous les lots d'un Appel d'Offres" })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  findAll(@Param('aoId', ParseUUIDPipe) aoId: string) {
    return this.lotsService.findAll(aoId);
  }
}
