import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AppelOffresService } from './appel-offres.service';
import { CreateAppelOffreDto } from './dto/create-appel-offre.dto';
import { UpdateAppelOffreDto } from './dto/update-appel-offre.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';
import { UploadCdcDto } from './dto/upload-cdc.dto';
import { FindAllAppelOffresDto } from './dto/find-all-appel-offre.dto';
import { CalculerDatesDto } from './dto/calculer-dates.dto';
import { Request } from 'express';
import { AppelOffre } from './entities/appel-offre.entity';

@ApiTags("Appels d'Offres")
@Controller('appels-offres')
export class AppelOffresController {
  constructor(private readonly appelOffresService: AppelOffresService) {}

  @Post()
  @ApiOperation({
    summary: "Créer un Appel d'Offres (Brouillon)",
    description:
      "Permet au Service Contractant de créer un nouvel Appel d'Offres au statut BROUILLON.",
  })
  @ApiResponse({
    status: 201,
    description: "L'Appel d'Offres a été créé avec succès.",
    type: AppelOffre,
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  create(@Body() createAppelOffreDto: CreateAppelOffreDto) {
    return this.appelOffresService.create(createAppelOffreDto);
  }

  @Post('calculer-dates')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Calculer les dates réglementaires par défaut',
    description:
      "Permet de proposer par défaut la date limite de soumission, la date de retrait CDC et la date d'ouverture des plis en fonction du type de procédure, avec report automatique du pli si c'est un week-end.",
  })
  @ApiResponse({
    status: 200,
    description: 'Dates calculées avec succès.',
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  calculerDates(@Body() dto: CalculerDatesDto) {
    return this.appelOffresService.calculateProposedDates(
      dto.typeProcedure,
      dto.datePublication,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Lister les Appels d'Offres avec filtres et pagination",
    description:
      "Permet de lister et de rechercher dynamiquement les Appels d'Offres (wilaya, secteur, type, mot-clé, pagination).",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des Appels d'Offres récupérée avec succès.",
    type: [AppelOffre],
  })
  findAll(@Query() query: FindAllAppelOffresDto) {
    return this.appelOffresService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Consulter un Appel d'Offres par son ID",
    description:
      "Permet d'obtenir les détails complets d'un Appel d'Offres spécifique.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Détails de l'Appel d'Offres récupérés.",
    type: AppelOffre,
  })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  findOne(@Param('id') id: string) {
    return this.appelOffresService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Modifier un Appel d'Offres",
    description:
      "Permet de modifier les informations générales d'un Appel d'Offres s'il est toujours au statut BROUILLON.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "L'Appel d'Offres a été mis à jour avec succès.",
    type: AppelOffre,
  })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  @ApiResponse({
    status: 409,
    description: "L'Appel d'Offres n'est pas en statut modifiable.",
  })
  update(
    @Param('id') id: string,
    @Body() updateAppelOffreDto: UpdateAppelOffreDto,
  ) {
    return this.appelOffresService.update(id, updateAppelOffreDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Supprimer un Appel d'Offres",
    description:
      "Permet de supprimer définitivement un Appel d'Offres (seulement s'il est en statut BROUILLON).",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "L'Appel d'Offres a été supprimé avec succès.",
    type: AppelOffre,
  })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  @ApiResponse({
    status: 409,
    description: "L'Appel d'Offres n'est pas en statut supprimable.",
  })
  remove(@Param('id') id: string) {
    return this.appelOffresService.remove(id);
  }

  @Patch(':id/statut')
  @ApiOperation({
    summary: "Mettre à jour le statut d'un Appel d'Offres",
    description:
      "Permet de piloter la machine à états de l'Appel d'Offres (ex: PUBLIE, EVALUE, ATTRIBUE, ANNULE).",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Le statut a été mis à jour avec succès.',
    type: AppelOffre,
  })
  @ApiResponse({
    status: 400,
    description: 'Transition de statut invalide.',
  })
  updateStatut(
    @Param('id') id: string,
    @Body() updateStatutDto: UpdateStatutDto,
  ) {
    return this.appelOffresService.updateStatut(id, updateStatutDto.statut);
  }

  // --------------------------------------------------------------------------
  // ROUTES GESTION DU CDC
  // --------------------------------------------------------------------------

  @Post(':id/cdc')
  @ApiOperation({
    summary: 'Lier un Cahier des Charges (CDC) pré-uploadé',
    description:
      "Permet d'associer un fichier CDC stocké dans le service documentaire à cet Appel d'Offres.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Le Cahier des Charges a été lié avec succès.',
    type: AppelOffre,
  })
  async uploadCdc(@Param('id') id: string, @Body() uploadCdcDto: UploadCdcDto) {
    const prixRetrait = uploadCdcDto.prixRetrait
      ? Number(uploadCdcDto.prixRetrait)
      : 0;
    return this.appelOffresService.uploadCdc(
      id,
      uploadCdcDto.documentId,
      prixRetrait,
    );
  }

  @Get(':id/cdc/download')
  @ApiOperation({
    summary: 'Obtenir un lien de téléchargement sécurisé du CDC',
    description:
      'Génère une URL présignée MinIO sécurisée et temporaire pour télécharger le fichier PDF du CDC, en traçant le retrait.',
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lien présigné généré avec succès.',
  })
  async getCdcDownloadUrl(
    @Param('id') id: string,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    const operateurId = req.user?.sub ?? 'anonymous';
    return this.appelOffresService.getPresignedDownloadUrl(id, operateurId);
  }

  @Get(':id/cdc')
  @ApiOperation({
    summary: 'Obtenir le CDC avec ses métadonnées et statistiques de retrait',
    description:
      'Retourne la liste des documents CDC avec les métadonnées enrichies du service documentaire, le prix, la date de publication et les retraits.',
  })
  @ApiParam({
    name: 'id',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du CDC et statistiques récupérés avec succès.',
  })
  async getCdcWithMetadata(@Param('id') id: string) {
    return this.appelOffresService.getCdcWithMetadata(id);
  }
}
