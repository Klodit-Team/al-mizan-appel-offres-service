import { PartialType } from '@nestjs/mapped-types';
import { CreateCriteresEvaluationDto } from './create-criteres-evaluation.dto';

export class UpdateCriteresEvaluationDto extends PartialType(CreateCriteresEvaluationDto) {}
