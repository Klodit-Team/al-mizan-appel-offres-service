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
import { MarcheService } from './marche.service';
import { CreateMarcheDto } from './dto/create-marche.dto';
import { UpdateMarcheDto } from './dto/update-marche.dto';

@ApiTags('Marchés')
@Controller('marches')
export class MarcheController {
  constructor(private readonly marcheService: MarcheService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une fiche marché' })
  create(@Body() createMarcheDto: CreateMarcheDto) {
    return this.marcheService.create(createMarcheDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les marchés' })
  findAll() {
    return this.marcheService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un marché' })
  findOne(@Param('id') id: string) {
    return this.marcheService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un marché' })
  update(@Param('id') id: string, @Body() updateMarcheDto: UpdateMarcheDto) {
    return this.marcheService.update(id, updateMarcheDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un marché' })
  remove(@Param('id') id: string) {
    return this.marcheService.remove(id);
  }
}
