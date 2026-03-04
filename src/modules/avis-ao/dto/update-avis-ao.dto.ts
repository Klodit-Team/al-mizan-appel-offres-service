import { PartialType } from '@nestjs/swagger';
import { CreateAvisAoDto } from './create-avis-ao.dto';

export class UpdateAvisAoDto extends PartialType(CreateAvisAoDto) {}
