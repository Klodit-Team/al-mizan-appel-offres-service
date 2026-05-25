import { ApiProperty } from '@nestjs/swagger';

export class Marche {
  @ApiProperty() id: string;
  @ApiProperty() aoId: string;
  @ApiProperty() attributionId: string;
  @ApiProperty() referenceMarche: string;
  @ApiProperty() montantSigne: number;
  @ApiProperty() dateSignature: Date;
  @ApiProperty() delaiExecution: number;
}
