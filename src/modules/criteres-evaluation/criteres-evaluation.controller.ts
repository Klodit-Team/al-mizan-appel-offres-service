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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CriteresEvaluationService } from './criteres-evaluation.service';
import { CreateCriteresEvaluationDto } from './dto/create-criteres-evaluation.dto';
import { UpdateCriteresEvaluationDto } from './dto/update-criteres-evaluation.dto';

@ApiTags('Criteres Evaluation')
@Controller('appels-offres/:aoId/criteres-evaluation')
export class CriteresEvaluationController {
  constructor(
    private readonly criteresEvaluationService: CriteresEvaluationService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Ajouter un critère d\'évaluation à un Appel d\'Offres' })
  @ApiParam({ name: 'aoId', description: 'UUID de l\'Appel d\'Offres', type: String })
  create(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Body() createCriteresEvaluationDto: CreateCriteresEvaluationDto,
  ) {
    return this.criteresEvaluationService.create(aoId, createCriteresEvaluationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les critères d\'évaluation d\'un Appel d\'Offres' })
  @ApiParam({ name: 'aoId', description: 'UUID de l\'Appel d\'Offres', type: String })
  findAll(@Param('aoId', ParseUUIDPipe) aoId: string) {
    return this.criteresEvaluationService.findAll(aoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un critère d\'évaluation par son ID' })
  @ApiParam({ name: 'aoId', description: 'UUID de l\'Appel d\'Offres', type: String })
  @ApiParam({ name: 'id', description: 'UUID du critère d\'évaluation', type: String })
  findOne(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.criteresEvaluationService.findOne(
      aoId,
      id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un critère d\'évaluation' })
  @ApiParam({ name: 'aoId', description: 'UUID de l\'Appel d\'Offres', type: String })
  @ApiParam({ name: 'id', description: 'UUID du critère d\'évaluation', type: String })
  update(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCriteresEvaluationDto: UpdateCriteresEvaluationDto,
  ) {
    return this.criteresEvaluationService.update(
      aoId,
      id,
      updateCriteresEvaluationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un critère d\'évaluation' })
  @ApiParam({ name: 'aoId', description: 'UUID de l\'Appel d\'Offres', type: String })
  @ApiParam({ name: 'id', description: 'UUID du critère d\'évaluation', type: String })
  remove(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.criteresEvaluationService.remove(
      aoId,
      id,
    );
  }
}
