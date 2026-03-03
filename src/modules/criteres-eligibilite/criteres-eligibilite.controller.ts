import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';
import { CreateCriteresEligibiliteDto } from './dto/create-criteres-eligibilite.dto';
import { UpdateCriteresEligibiliteDto } from './dto/update-criteres-eligibilite.dto';

@Controller('criteres-eligibilite')
export class CriteresEligibiliteController {
  constructor(
    private readonly criteresEligibiliteService: CriteresEligibiliteService,
  ) {}

  @Post()
  create(@Body() createCriteresEligibiliteDto: CreateCriteresEligibiliteDto) {
    return this.criteresEligibiliteService.create(createCriteresEligibiliteDto);
  }

  @Get()
  findAll() {
    return this.criteresEligibiliteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.criteresEligibiliteService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCriteresEligibiliteDto: UpdateCriteresEligibiliteDto,
  ) {
    return this.criteresEligibiliteService.update(
      +id,
      updateCriteresEligibiliteDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.criteresEligibiliteService.remove(+id);
  }
}
