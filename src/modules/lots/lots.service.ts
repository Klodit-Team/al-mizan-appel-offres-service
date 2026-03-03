import { Injectable } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';

@Injectable()
export class LotsService {
  create(_createLotDto: CreateLotDto) {
    console.log(_createLotDto);
    return 'This action adds a new lot';
  }

  findAll() {
    return `This action returns all lots`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lot`;
  }

  update(id: number, _updateLotDto: UpdateLotDto) {
    console.log(_updateLotDto);
    return `This action updates a #${id} lot`;
  }

  remove(id: number) {
    return `This action removes a #${id} lot`;
  }
}
