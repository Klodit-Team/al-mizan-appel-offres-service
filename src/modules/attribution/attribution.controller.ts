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
import { AttributionService } from './attribution.service';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { UpdateAttributionDto } from './dto/update-attribution.dto';
import { Attribution } from './entities/attribution.entity';

@ApiTags('Attributions')
@Controller('attributions')
export class AttributionController {
  constructor(private readonly attributionService: AttributionService) {}

  @Post()
  @ApiOperation({
    summary: 'Prononcer une attribution (provisoire ou définitive)',
  })
  @ApiResponse({ status: 201, type: Attribution })
  create(@Body() createAttributionDto: CreateAttributionDto) {
    return this.attributionService.create(createAttributionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les attributions' })
  @ApiResponse({ status: 200, type: [Attribution] })
  findAll() {
    return this.attributionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une attribution' })
  @ApiResponse({ status: 200, type: Attribution })
  findOne(@Param('id') id: string) {
    return this.attributionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une attribution' })
  @ApiResponse({ status: 200, type: Attribution })
  update(
    @Param('id') id: string,
    @Body() updateAttributionDto: UpdateAttributionDto,
  ) {
    return this.attributionService.update(id, updateAttributionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Annuler/Supprimer une attribution' })
  @ApiResponse({ status: 200, type: Attribution })
  remove(@Param('id') id: string) {
    return this.attributionService.remove(id);
  }
}
