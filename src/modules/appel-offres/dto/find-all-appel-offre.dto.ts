import { ApiProperty } from '@nestjs/swagger';
import { StatutAO, TypeProcedure } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllAppelOffresDto {
  @ApiProperty({ required: false, description: 'Filtrer par wilaya' })
  @IsString({ message: 'La wilaya doit être une chaîne de caractères' })
  @IsOptional()
  wilaya?: string;

  @ApiProperty({
    required: false,
    description: "Filtrer par secteur d'activité",
  })
  @IsString({
    message: "Le secteur d'activité doit être une chaîne de caractères",
  })
  @IsOptional()
  secteurActivite?: string;

  @ApiProperty({
    required: false,
    enum: TypeProcedure,
    description: 'Filtrer par type de procédure',
  })
  @IsEnum(TypeProcedure)
  @IsOptional()
  typeProcedure?: TypeProcedure;

  @ApiProperty({
    required: false,
    enum: StatutAO,
    description: 'Filtrer par statut',
  })
  @IsEnum(StatutAO)
  @IsOptional()
  statut?: StatutAO;

  @ApiProperty({
    required: false,
    description: 'Numéro de la page (commence à 1)',
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Le numéro de la page doit être un nombre entier' })
  @Min(1, { message: 'Le numéro de la page doit être supérieur ou égal à 1' })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Nombre de résultats par page',
    default: 10,
  })
  @Type(() => Number)
  @IsInt({
    message: 'Le nombre de résultats par page doit être un nombre entier',
  })
  @Min(1, {
    message: 'Le nombre de résultats par page doit être supérieur ou égal à 1',
  })
  @IsOptional()
  limit?: number = 10;
}
