import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeAttribution } from '@prisma/client';

export class Attribution {
  @ApiProperty() id: string;
  @ApiProperty() aoId: string;
  @ApiPropertyOptional() lotId: string | null;
  @ApiProperty() soumissionId: string;
  @ApiProperty({ enum: TypeAttribution }) type: TypeAttribution;
  @ApiProperty() dateAttribution: Date;
  @ApiProperty() dateFinRecours: Date;
  @ApiProperty() montantAttribue: number;
}