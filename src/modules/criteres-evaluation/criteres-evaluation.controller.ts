import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CriteresEvaluationService } from './criteres-evaluation.service';
import { CreateCriteresEvaluationDto } from './dto/create-criteres-evaluation.dto';
import { UpdateCriteresEvaluationDto } from './dto/update-criteres-evaluation.dto';

@Controller('criteres-evaluation')
export class CriteresEvaluationController {
  constructor(
    private readonly criteresEvaluationService: CriteresEvaluationService,
  ) {}

  @Post()
  create(@Body() createCriteresEvaluationDto: CreateCriteresEvaluationDto) {
    return this.criteresEvaluationService.create(createCriteresEvaluationDto);
  }

  @Get()
  findAll() {
    return this.criteresEvaluationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.criteresEvaluationService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCriteresEvaluationDto: UpdateCriteresEvaluationDto,
  ) {
    return this.criteresEvaluationService.update(
      +id,
      updateCriteresEvaluationDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.criteresEvaluationService.remove(+id);
  }
}
