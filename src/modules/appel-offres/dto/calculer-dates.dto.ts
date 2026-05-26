import { ApiProperty } from '@nestjs/swagger';
import { TypeProcedure } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CalculerDatesDto {
  @ApiProperty({
    enum: TypeProcedure,
    description: 'Le type de procédure réglementaire',
  })
  @IsEnum(TypeProcedure, { message: "Le type de procédure n'est pas valide" })
  @IsNotEmpty({ message: 'Le type de procédure est requis' })
  typeProcedure: TypeProcedure;

  @ApiProperty({
    description:
      "La date de publication de l'AO (format ISO8601, défaut à la date courante)",
    required: false,
    example: '2026-05-26T03:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La date de publication doit être au format ISO-8601' },
  )
  datePublication?: string;
}
