import { ApiProperty } from '@nestjs/swagger';
import { TypeAttribution } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateAttributionDto {
  @ApiProperty({ description: "UUID de l'Appel d'Offres" })
  @IsUUID('4', { message: "L'UUID de l'Appel d'Offres doit être valide" })
  aoId: string;

  @ApiProperty({ required: false })
  @IsUUID('4', { message: "L'UUID du lot doit être valide" })
  @IsOptional()
  lotId?: string;

  @ApiProperty({ description: 'ID de la soumission gagnante' })
  @IsUUID('4', { message: "L'UUID de la soumission doit être valide" })
  soumissionId: string;

  @ApiProperty({ enum: TypeAttribution })
  @IsEnum(TypeAttribution)
  type: TypeAttribution;

  @ApiProperty({ description: "Date d'attribution" })
  @IsDateString({}, { message: "La date d'attribution doit être valide" })
  dateAttribution: string;

  @ApiProperty({ description: 'Date de fin de recours' })
  @IsDateString({}, { message: 'La date de fin de recours doit être valide' })
  dateFinRecours: string;

  @ApiProperty({ description: 'Montant attribué' })
  @IsNumber({}, { message: 'Le montant attribué doit être un nombre' })
  @IsPositive({ message: 'Le montant attribué doit être positif' })
  montantAttribue: number;
}
