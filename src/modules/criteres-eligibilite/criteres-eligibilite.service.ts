import { Injectable } from '@nestjs/common';
import { CreateCriteresEligibiliteDto } from './dto/create-criteres-eligibilite.dto';
import { UpdateCriteresEligibiliteDto } from './dto/update-criteres-eligibilite.dto';

@Injectable()
export class CriteresEligibiliteService {
  create(_createCriteresEligibiliteDto: CreateCriteresEligibiliteDto) {
    console.log(_createCriteresEligibiliteDto);
    return 'This action adds a new criteresEligibilite';
  }

  findAll() {
    return `This action returns all criteresEligibilite`;
  }

  findOne(id: number) {
    return `This action returns a #${id} criteresEligibilite`;
  }

  update(
    id: number,
    _updateCriteresEligibiliteDto: UpdateCriteresEligibiliteDto,
  ) {
    console.log(_updateCriteresEligibiliteDto);
    return `This action updates a #${id} criteresEligibilite`;
  }

  remove(id: number) {
    return `This action removes a #${id} criteresEligibilite`;
  }
}
