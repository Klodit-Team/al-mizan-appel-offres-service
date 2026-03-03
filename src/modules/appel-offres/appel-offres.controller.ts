import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AppelOffresService } from './appel-offres.service';
import { CreateAppelOffreDto } from './dto/create-appel-offre.dto';
import { UpdateAppelOffreDto } from './dto/update-appel-offre.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';

@Controller('appel-offres')
export class AppelOffresController {
  constructor(private readonly appelOffresService: AppelOffresService) {}

  @Post()
  create(@Body() createAppelOffreDto: CreateAppelOffreDto) {
    return this.appelOffresService.create(createAppelOffreDto);
  }

  @Get()
  findAll() {
    return this.appelOffresService.findAll();
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
}
