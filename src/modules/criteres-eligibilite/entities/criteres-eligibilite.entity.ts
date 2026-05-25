import { ApiProperty } from '@nestjs/swagger';
import { TypeCritereEligibilite } from '@prisma/client';

export class CriteresEligibilite {
  @ApiProperty() id: string;
  @ApiProperty() aoId: string;
  @ApiProperty() libelle: string;
  @ApiProperty({ enum: TypeCritereEligibilite }) type: TypeCritereEligibilite;
  @ApiProperty() valeurMinimale: string;
  @ApiProperty() eliminatoire: boolean;
}
