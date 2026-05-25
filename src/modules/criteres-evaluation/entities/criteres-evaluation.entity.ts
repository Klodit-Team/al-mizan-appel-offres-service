import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategorieCritereEvaluation } from '@prisma/client';

export class CriteresEvaluation {
  @ApiProperty() id: string;
  @ApiProperty() aoId: string;
  @ApiPropertyOptional() lotId: string | null;
  @ApiProperty() libelle: string;
  @ApiProperty({ enum: CategorieCritereEvaluation })
  categorie: CategorieCritereEvaluation;
  @ApiProperty() poids: number;
  @ApiPropertyOptional() noteEliminatoire: number | null;
}
