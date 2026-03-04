import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AvisAoService } from './avis-ao.service';
import { CreateAvisAoDto } from './dto/create-avis-ao.dto';
import { UpdateAvisAoDto } from './dto/update-avis-ao.dto';

@ApiTags('Avis AO')
@Controller('avis-ao')
export class AvisAoController {
  constructor(private readonly avisAoService: AvisAoService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel avis réglementaire' })
  create(@Body() createAvisAoDto: CreateAvisAoDto) {
    return this.avisAoService.create(createAvisAoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les avis' })
  findAll() {
    return this.avisAoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Voir un avis' })
  findOne(@Param('id') id: string) {
    return this.avisAoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un avis' })
  update(@Param('id') id: string, @Body() updateAvisAoDto: UpdateAvisAoDto) {
    return this.avisAoService.update(id, updateAvisAoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un avis' })
  remove(@Param('id') id: string) {
    return this.avisAoService.remove(id);
  }
}
