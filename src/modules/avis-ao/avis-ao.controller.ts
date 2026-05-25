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
import { AvisAoService } from './avis-ao.service';
import { CreateAvisAoDto } from './dto/create-avis-ao.dto';
import { UpdateAvisAoDto } from './dto/update-avis-ao.dto';
import { AvisAo } from './entities/avis-ao.entity';

@ApiTags('Avis AO')
@Controller('avis-ao')
export class AvisAoController {
  constructor(private readonly avisAoService: AvisAoService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouvel avis réglementaire',
    description:
      "Permet de publier un avis réglementaire (ex: avis d'Appel d'Offres, avis d'attribution provisoire ou définitive, avis d'annulation) sur la plateforme.",
  })
  @ApiResponse({
    status: 201,
    description: "L'avis réglementaire a été créé et publié avec succès.",
    type: AvisAo,
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  create(@Body() createAvisAoDto: CreateAvisAoDto): Promise<AvisAo> {
    return this.avisAoService.create(createAvisAoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les avis réglementaires',
    description:
      'Permet de récupérer la liste complète des avis réglementaires publiés.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des avis récupérée avec succès.',
    type: [AvisAo],
  })
  findAll(): Promise<AvisAo[]> {
    return this.avisAoService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Voir un avis réglementaire par son ID',
    description:
      "Permet d'obtenir les détails complets d'un avis réglementaire spécifique.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'avis réglementaire",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Détails de l'avis récupérés.",
    type: AvisAo,
  })
  @ApiResponse({ status: 404, description: 'Avis réglementaire introuvable.' })
  findOne(@Param('id') id: string): Promise<AvisAo> {
    return this.avisAoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier un avis réglementaire',
    description:
      "Permet de modifier le contenu ou les dates d'un avis réglementaire existant.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'avis réglementaire à modifier",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "L'avis réglementaire a été modifié avec succès.",
    type: AvisAo,
  })
  @ApiResponse({ status: 404, description: 'Avis réglementaire introuvable.' })
  update(
    @Param('id') id: string,
    @Body() updateAvisAoDto: UpdateAvisAoDto,
  ): Promise<AvisAo> {
    return this.avisAoService.update(id, updateAvisAoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un avis réglementaire',
    description:
      "Permet d'archiver ou de supprimer définitivement un avis réglementaire.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'avis réglementaire à supprimer",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "L'avis réglementaire a été supprimé avec succès.",
    type: AvisAo,
  })
  @ApiResponse({ status: 404, description: 'Avis réglementaire introuvable.' })
  remove(@Param('id') id: string): Promise<AvisAo> {
    return this.avisAoService.remove(id);
  }
}
