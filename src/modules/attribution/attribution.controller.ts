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
import { AttributionService } from './attribution.service';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { UpdateAttributionDto } from './dto/update-attribution.dto';

@ApiTags('Attributions')
@Controller('attributions')
export class AttributionController {
  constructor(private readonly attributionService: AttributionService) {}

  @Post()
  @ApiOperation({
    summary: 'Prononcer une attribution (provisoire ou définitive)',
  })
  create(@Body() createAttributionDto: CreateAttributionDto) {
    return this.attributionService.create(createAttributionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les attributions' })
  findAll() {
    return this.attributionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une attribution' })
  findOne(@Param('id') id: string) {
    return this.attributionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une attribution' })
  update(
    @Param('id') id: string,
    @Body() updateAttributionDto: UpdateAttributionDto,
  ) {
    return this.attributionService.update(id, updateAttributionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler/Supprimer une attribution' })
  remove(@Param('id') id: string) {
    return this.attributionService.remove(id);
  }
}
