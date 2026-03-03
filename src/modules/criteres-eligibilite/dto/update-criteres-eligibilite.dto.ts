import { PartialType } from '@nestjs/mapped-types';
import { CreateCriteresEligibiliteDto } from './create-criteres-eligibilite.dto';

export class UpdateCriteresEligibiliteDto extends PartialType(CreateCriteresEligibiliteDto) {}
