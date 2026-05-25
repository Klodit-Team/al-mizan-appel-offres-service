import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarcheService } from './marche.service';
import { CreateMarcheDto } from './dto/create-marche.dto';
import { UpdateMarcheDto } from './dto/update-marche.dto';
import { Marche } from './entities/marche.entity';

@ApiTags('Marchés')
@Controller('marches')
export class MarcheController {
  constructor(private readonly marcheService: MarcheService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une fiche marché' })
  @ApiResponse({ status: 201, type: Marche })
  create(@Body() createMarcheDto: CreateMarcheDto) {
    return this.marcheService.create(createMarcheDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les marchés' })
  @ApiResponse({ status: 200, type: [Marche] })
  findAll() {
    return this.marcheService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un marché' })
  @ApiResponse({ status: 200, type: Marche })
  findOne(@Param('id') id: string) {
    return this.marcheService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un marché' })
  @ApiResponse({ status: 200, type: Marche })
  update(@Param('id') id: string, @Body() updateMarcheDto: UpdateMarcheDto) {
    return this.marcheService.update(id, updateMarcheDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un marché' })
  @ApiResponse({ status: 200, type: Marche })
  remove(@Param('id') id: string) {
    return this.marcheService.remove(id);
  }
}
