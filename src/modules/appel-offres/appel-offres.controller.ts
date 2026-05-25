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
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppelOffresService } from './appel-offres.service';
import { CreateAppelOffreDto } from './dto/create-appel-offre.dto';
import { UpdateAppelOffreDto } from './dto/update-appel-offre.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';
import { UploadCdcDto } from './dto/upload-cdc.dto';
import { FindAllAppelOffresDto } from './dto/find-all-appel-offre.dto';
import { Request } from 'express';
import { AppelOffre } from './entities/appel-offre.entity';

@Controller('appels-offres')
export class AppelOffresController {
  constructor(private readonly appelOffresService: AppelOffresService) {}

  @Post()
  @ApiResponse({ status: 201, type: AppelOffre })
  create(@Body() createAppelOffreDto: CreateAppelOffreDto) {
    return this.appelOffresService.create(createAppelOffreDto);
  }

  @Get()
  @ApiOperation({
    summary: "Lister les Appels d'Offres avec filtres et pagination",
  })
  findAll(@Query() query: FindAllAppelOffresDto) {
    return this.appelOffresService.findAll(query);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: AppelOffre })
  findOne(@Param('id') id: string) {
    return this.appelOffresService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, type: AppelOffre })
  update(
    @Param('id') id: string,
    @Body() updateAppelOffreDto: UpdateAppelOffreDto,
  ) {
    return this.appelOffresService.update(id, updateAppelOffreDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, type: AppelOffre })
  remove(@Param('id') id: string) {
    return this.appelOffresService.remove(id);
  }

  @Patch(':id/statut')
  @ApiResponse({ status: 200, type: AppelOffre })
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
  @ApiOperation({ summary: 'Lier un Cahier des Charges (CDC) pré-uploadé' })
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
    summary: 'Alias: obtenir un lien de téléchargement sécurisé du CDC',
  })
  async getCdcDownloadUrlAlias(
    @Param('id') id: string,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    const operateurId = req.user?.sub ?? 'anonymous';
    return this.appelOffresService.getPresignedDownloadUrl(id, operateurId);
  }
}
