import { Injectable } from '@nestjs/common';
import { CreateCriteresEvaluationDto } from './dto/create-criteres-evaluation.dto';
import { UpdateCriteresEvaluationDto } from './dto/update-criteres-evaluation.dto';

@Injectable()
export class CriteresEvaluationService {
  create(createCriteresEvaluationDto: CreateCriteresEvaluationDto) {
    return 'This action adds a new criteresEvaluation';
  }

  findAll() {
    return `This action returns all criteresEvaluation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} criteresEvaluation`;
  }

  update(id: number, updateCriteresEvaluationDto: UpdateCriteresEvaluationDto) {
    return `This action updates a #${id} criteresEvaluation`;
  }

  remove(id: number) {
    return `This action removes a #${id} criteresEvaluation`;
  }
}
