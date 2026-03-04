import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { AppelOffresService } from './appel-offres.service';
import { CreateAppelOffreDto } from './dto/create-appel-offre.dto';
import { UpdateAppelOffreDto } from './dto/update-appel-offre.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';
import { UploadCdcDto } from './dto/upload-cdc.dto';
import { FindAllAppelOffresDto } from './dto/find-all-appel-offre.dto';

@Controller('appel-offres')
export class AppelOffresController {
  constructor(private readonly appelOffresService: AppelOffresService) {}

  @Post()
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
  findOne(@Param('id') id: string) {
    return this.appelOffresService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppelOffreDto: UpdateAppelOffreDto,
  ) {
    return this.appelOffresService.update(id, updateAppelOffreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appelOffresService.remove(id);
  }

  @Patch(':id/statut')
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
  @ApiOperation({ summary: 'Uploader le Cahier des Charges (CDC) sur MinIO' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fichier'))
  async uploadCdc(
    @Param('id') id: string,
    @Body() uploadCdcDto: UploadCdcDto,
    @UploadedFile() fichier: Express.Multer.File,
  ) {
    if (!fichier) {
      throw new BadRequestException('Aucun fichier fourni.');
    }

    // Le prix retrait est envoyé sous forme de string via form-data, on le convertit en nombre
    const prixRetrait = uploadCdcDto.prixRetrait
      ? Number(uploadCdcDto.prixRetrait)
      : 0;

    return this.appelOffresService.uploadCdc(
      id,
      fichier.buffer,
      fichier.mimetype,
      prixRetrait,
    );
  }

  @Get(':id/cdc/download')
  @ApiOperation({
    summary: 'Obtenir un lien de téléchargement sécurisé du CDC',
  })
  async getCdcDownloadUrl(@Param('id') id: string) {
    // 💡 Ici, dans un vrai backend, on récupérerait l'ID de l'opérateur connecté
    // depuis le Token (ex: req.user.id). Pour l'instant, on met un UUID mock.
    const mockOperateurId = '123e4567-e89b-12d3-a456-426614174000';

    return this.appelOffresService.getPresignedDownloadUrl(id, mockOperateurId);
  }
}
