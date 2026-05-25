import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AttributionService } from './attribution.service';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { UpdateAttributionDto } from './dto/update-attribution.dto';
import { Attribution } from './entities/attribution.entity';

@ApiTags('Attributions')
@Controller('attributions')
export class AttributionController {
  constructor(private readonly attributionService: AttributionService) {}

  @Post()
  @ApiOperation({
    summary: 'Prononcer une attribution (provisoire ou définitive)',
    description:
      "Permet d'attribuer provisoirement ou définitivement un lot d'un Appel d'Offres à un Opérateur Économique.",
  })
  @ApiResponse({
    status: 201,
    description: "L'attribution a été prononcée et enregistrée avec succès.",
    type: Attribution,
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  @ApiResponse({
    status: 404,
    description: "Lot ou Appel d'Offres introuvable.",
  })
  create(@Body() createAttributionDto: CreateAttributionDto) {
    return this.attributionService.create(createAttributionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les attributions',
    description:
      "Permet d'obtenir la liste de toutes les attributions (provisoires et définitives) enregistrées.",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des attributions récupérée.',
    type: [Attribution],
  })
  findAll() {
    return this.attributionService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter une attribution par son ID',
    description:
      "Permet de consulter les détails complets d'une attribution spécifique.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'attribution",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Détails de l'attribution récupérés.",
    type: Attribution,
  })
  @ApiResponse({ status: 404, description: 'Attribution introuvable.' })
  findOne(@Param('id') id: string) {
    return this.attributionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier une attribution',
    description: "Permet de modifier les détails d'une attribution existante.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'attribution à modifier",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Attribution mise à jour avec succès.',
    type: Attribution,
  })
  @ApiResponse({ status: 404, description: 'Attribution introuvable.' })
  update(
    @Param('id') id: string,
    @Body() updateAttributionDto: UpdateAttributionDto,
  ) {
    return this.attributionService.update(id, updateAttributionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Annuler/Supprimer une attribution',
    description:
      "Permet d'annuler ou de supprimer définitivement une attribution de lot.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'attribution à supprimer",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Attribution annulée avec succès.',
    type: Attribution,
  })
  @ApiResponse({ status: 404, description: 'Attribution introuvable.' })
  remove(@Param('id') id: string) {
    return this.attributionService.remove(id);
  }
}
