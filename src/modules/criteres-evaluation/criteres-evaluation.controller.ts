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
import { CriteresEvaluationService } from './criteres-evaluation.service';
import { CreateCriteresEvaluationDto } from './dto/create-criteres-evaluation.dto';
import { UpdateCriteresEvaluationDto } from './dto/update-criteres-evaluation.dto';
import { CriteresEvaluation } from './entities/criteres-evaluation.entity';

@ApiTags('Criteres Evaluation')
@Controller('appels-offres/:aoId/criteres-evaluation')
export class CriteresEvaluationController {
  constructor(
    private readonly criteresEvaluationService: CriteresEvaluationService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Ajouter un critère d'évaluation à un Appel d'Offres",
    description:
      "Permet de définir un critère d'évaluation technique ou financier pour un Appel d'Offres spécifique.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: "Le critère d'évaluation a été ajouté avec succès.",
    type: CriteresEvaluation,
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  create(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Body() createCriteresEvaluationDto: CreateCriteresEvaluationDto,
  ): Promise<CriteresEvaluation> {
    return this.criteresEvaluationService.create(
      aoId,
      createCriteresEvaluationDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Lister tous les critères d'évaluation d'un Appel d'Offres",
    description:
      "Permet de lister tous les critères définis pour un Appel d'Offres.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Liste des critères d'évaluation récupérée.",
    type: [CriteresEvaluation],
  })
  findAll(
    @Param('aoId', ParseUUIDPipe) aoId: string,
  ): Promise<CriteresEvaluation[]> {
    return this.criteresEvaluationService.findAll(aoId);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Obtenir un critère d'évaluation par son ID",
    description:
      "Permet d'obtenir les détails d'un critère d'évaluation spécifique.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: "UUID du critère d'évaluation",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Détails du critère d'évaluation récupérés.",
    type: CriteresEvaluation,
  })
  @ApiResponse({
    status: 404,
    description: "Critère d'évaluation introuvable.",
  })
  findOne(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CriteresEvaluation> {
    return this.criteresEvaluationService.findOne(aoId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Mettre à jour un critère d'évaluation",
    description:
      "Permet de modifier les coefficients, pondérations ou informations d'un critère.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: "UUID du critère d'évaluation",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Le critère d'évaluation a été mis à jour avec succès.",
    type: CriteresEvaluation,
  })
  @ApiResponse({
    status: 404,
    description: "Critère d'évaluation introuvable.",
  })
  update(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCriteresEvaluationDto: UpdateCriteresEvaluationDto,
  ): Promise<CriteresEvaluation> {
    return this.criteresEvaluationService.update(
      aoId,
      id,
      updateCriteresEvaluationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Supprimer un critère d'évaluation",
    description: "Permet de supprimer définitivement un critère d'évaluation.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: "UUID du critère d'évaluation",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Le critère d'évaluation a été supprimé avec succès.",
    type: CriteresEvaluation,
  })
  @ApiResponse({
    status: 404,
    description: "Critère d'évaluation introuvable.",
  })
  remove(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CriteresEvaluation> {
    return this.criteresEvaluationService.remove(aoId, id);
  }
}
