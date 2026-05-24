import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Lot {
  @ApiProperty() id: string;
  @ApiProperty() aoId: string;
  @ApiProperty() numero: string;
  @ApiProperty() designation: string;
  @ApiProperty() montantEstime: number;
  @ApiPropertyOptional() statut: string | null;
}