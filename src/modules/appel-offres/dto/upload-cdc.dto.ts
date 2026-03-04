import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UploadCdcDto {
  @ApiProperty({
    description: 'Prix de retrait du Cahier des Charges en DZD (0 si gratuit)',
    example: 2000,
    required: false,
  })
  @IsOptional({ message: 'Le prix de retrait est optionnel' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Le prix de retrait doit être un nombre' })
  @Min(0, { message: 'Le prix de retrait doit être supérieur ou égal à 0' })
  prixRetrait?: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Le fichier PDF du CDC',
  })
  fichier: any;
}
