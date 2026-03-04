import { PartialType } from '@nestjs/swagger';
import { CreateAttributionDto } from './create-attribution.dto';

export class UpdateAttributionDto extends PartialType(CreateAttributionDto) {}
