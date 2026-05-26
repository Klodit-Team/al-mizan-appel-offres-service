import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MarcheService } from './marche.service';
import { CreateMarcheDto } from './dto/create-marche.dto';
import { UpdateMarcheDto } from './dto/update-marche.dto';
import { Marche } from './entities/marche.entity';

@ApiTags('Marchés')
@Controller('marches')
export class MarcheController {
  constructor(private readonly marcheService: MarcheService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une fiche marché',
    description:
      "Permet d'enregistrer la formalisation contractuelle définitive (Marché signé) liée à une attribution.",
  })
  @ApiResponse({
    status: 201,
    description: 'La fiche marché a été créée avec succès.',
    type: Marche,
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  @ApiResponse({
    status: 409,
    description: 'Un marché existe déjà pour cette attribution ou référence.',
  })
  create(@Body() createMarcheDto: CreateMarcheDto) {
    return this.marcheService.create(createMarcheDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les marchés',
    description:
      'Permet de lister tous les marchés enregistrés sur la plateforme.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des marchés récupérée avec succès.',
    type: [Marche],
  })
  findAll() {
    return this.marcheService.findAll();
  }

  @Get('statistiques')
  @ApiOperation({
    summary: 'Obtenir les statistiques des marchés clôturés',
    description:
      "Permet aux Services Contractants de visualiser le nombre global, les montants financiers cumulés et les délais cumulés pour l'ensemble des marchés au statut Clôturé.",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès.',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès interdit.',
  })
  async getCloturedStats(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new BadRequestException("L'en-tête x-user-id est requis.");
    }
    return this.marcheService.getCloturedMarketsStats(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un marché par son ID',
    description: "Permet d'obtenir les détails complets d'une fiche marché.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID unique de la fiche marché',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du marché récupérés.',
    type: Marche,
  })
  @ApiResponse({ status: 404, description: 'Fiche marché introuvable.' })
  findOne(@Param('id') id: string) {
    return this.marcheService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier un marché',
    description: "Permet de modifier les informations d'un marché existant.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID unique du marché à modifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Fiche marché mise à jour avec succès.',
    type: Marche,
  })
  @ApiResponse({ status: 404, description: 'Fiche marché introuvable.' })
  update(@Param('id') id: string, @Body() updateMarcheDto: UpdateMarcheDto) {
    return this.marcheService.update(id, updateMarcheDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un marché',
    description:
      'Permet de supprimer définitivement une fiche marché de la plateforme.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID unique du marché à supprimer',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Fiche marché supprimée avec succès.',
    type: Marche,
  })
  @ApiResponse({ status: 404, description: 'Fiche marché introuvable.' })
  remove(@Param('id') id: string) {
    return this.marcheService.remove(id);
  }
}
