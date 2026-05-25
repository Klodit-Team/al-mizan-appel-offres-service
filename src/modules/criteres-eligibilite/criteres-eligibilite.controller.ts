import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';
import { CreateCriteresEligibiliteDto } from './dto/create-criteres-eligibilite.dto';
import { UpdateCriteresEligibiliteDto } from './dto/update-criteres-eligibilite.dto';
import { CriteresEligibilite } from './entities/criteres-eligibilite.entity';

@ApiTags('Criteres Eligibilite')
@Controller('appels-offres/:aoId/criteres-eligibilite')
export class CriteresEligibiliteController {
  constructor(
    private readonly criteresEligibiliteService: CriteresEligibiliteService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Créer un critère d'éligibilité pour un Appel d'Offres",
    description:
      "Permet de définir des critères d'éligibilité minimaux (ex: Chiffre d'Affaires requis, Certifications) pour un Appel d'Offres.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: "Le critère d'éligibilité a été créé avec succès.",
    type: CriteresEligibilite,
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  create(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Body() createCriteresEligibiliteDto: CreateCriteresEligibiliteDto,
  ): Promise<CriteresEligibilite> {
    return this.criteresEligibiliteService.create(
      aoId,
      createCriteresEligibiliteDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Lister tous les critères d'éligibilité d'un Appel d'Offres",
    description:
      "Permet de récupérer l'ensemble des critères d'éligibilité liés à un Appel d'Offres.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Liste des critères d'éligibilité récupérée.",
    type: [CriteresEligibilite],
  })
  findAll(
    @Param('aoId', ParseUUIDPipe) aoId: string,
  ): Promise<CriteresEligibilite[]> {
    return this.criteresEligibiliteService.findAll(aoId);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Récupérer un critère d'éligibilité par son ID",
    description:
      "Permet d'obtenir les détails d'un critère d'éligibilité spécifique.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({ name: 'id', description: 'UUID du critère', type: String })
  @ApiResponse({
    status: 200,
    description: "Détails du critère d'éligibilité récupérés.",
    type: CriteresEligibilite,
  })
  @ApiResponse({
    status: 404,
    description: "Critère d'éligibilité introuvable.",
  })
  findOne(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CriteresEligibilite> {
    return this.criteresEligibiliteService.findOne(aoId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Mettre à jour un critère d'éligibilité",
    description:
      "Permet de modifier les valeurs limites ou descriptifs d'un critère d'éligibilité.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({ name: 'id', description: 'UUID du critère', type: String })
  @ApiResponse({
    status: 200,
    description: "Le critère d'éligibilité a été mis à jour avec succès.",
    type: CriteresEligibilite,
  })
  @ApiResponse({
    status: 404,
    description: "Critère d'éligibilité introuvable.",
  })
  update(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCriteresEligibiliteDto: UpdateCriteresEligibiliteDto,
  ): Promise<CriteresEligibilite> {
    return this.criteresEligibiliteService.update(
      aoId,
      id,
      updateCriteresEligibiliteDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Supprimer un critère d'éligibilité",
    description:
      "Permet de supprimer définitivement un critère d'éligibilité d'un Appel d'Offres.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({ name: 'id', description: 'UUID du critère', type: String })
  @ApiResponse({
    status: 200,
    description: "Le critère d'éligibilité a été supprimé avec succès.",
    type: CriteresEligibilite,
  })
  @ApiResponse({
    status: 404,
    description: "Critère d'éligibilité introuvable.",
  })
  remove(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CriteresEligibilite> {
    return this.criteresEligibiliteService.remove(aoId, id);
  }
}
