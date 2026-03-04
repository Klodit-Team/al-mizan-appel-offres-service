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
import { CriteresEligibiliteService } from './criteres-eligibilite.service';
import { CreateCriteresEligibiliteDto } from './dto/create-criteres-eligibilite.dto';
import { UpdateCriteresEligibiliteDto } from './dto/update-criteres-eligibilite.dto';

@ApiTags('Criteres Eligibilite')
@Controller('appels-offres/:aoId/criteres-eligibilite')
export class CriteresEligibiliteController {
  constructor(
    private readonly criteresEligibiliteService: CriteresEligibiliteService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Créer un critère d'éligibilité pour un Appel d'Offres",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  create(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Body() createCriteresEligibiliteDto: CreateCriteresEligibiliteDto,
  ) {
    return this.criteresEligibiliteService.create(
      aoId,
      createCriteresEligibiliteDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Lister tous les critères d'éligibilité d'un Appel d'Offres",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  findAll(@Param('aoId', ParseUUIDPipe) aoId: string) {
    return this.criteresEligibiliteService.findAll(aoId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer un critère d'éligibilité par son ID" })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({ name: 'id', description: 'UUID du critère', type: String })
  findOne(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.criteresEligibiliteService.findOne(aoId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Mettre à jour un critère d'éligibilité" })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({ name: 'id', description: 'UUID du critère', type: String })
  update(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCriteresEligibiliteDto: UpdateCriteresEligibiliteDto,
  ) {
    return this.criteresEligibiliteService.update(
      aoId,
      id,
      updateCriteresEligibiliteDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: "Supprimer un critère d'éligibilité" })
  @ApiParam({
    name: 'aoId',
    description: "UUID de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({ name: 'id', description: 'UUID du critère', type: String })
  remove(
    @Param('aoId', ParseUUIDPipe) aoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.criteresEligibiliteService.remove(aoId, id);
  }
}
