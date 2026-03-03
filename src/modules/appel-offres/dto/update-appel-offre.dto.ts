import { PartialType } from '@nestjs/swagger';
import { CreateAppelOffreDto } from './create-appel-offre.dto';

export class UpdateAppelOffreDto extends PartialType(CreateAppelOffreDto) { }
