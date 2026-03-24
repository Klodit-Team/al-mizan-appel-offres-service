import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, IsUUID, IsNotEmpty } from 'class-validator';

export class UploadCdcDto {
  @ApiProperty({
    description: 'ID du document uploadé dans le Document Service',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Le documentId doit être un UUID valide (v4)' })
  @IsNotEmpty({ message: 'Le documentId est obligatoire' })
  documentId: string;

  @ApiProperty({
    description: 'Prix de retrait du Cahier des Charges en DZD (0 si gratuit)',
    example: 2000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Le prix de retrait doit être un nombre' })
  @Min(0, { message: 'Le prix de retrait doit être supérieur ou égal à 0' })
  prixRetrait?: number;
}
