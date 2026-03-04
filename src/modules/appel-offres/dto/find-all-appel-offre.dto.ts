import { ApiProperty } from '@nestjs/swagger';
import { StatutAO, TypeProcedure } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllAppelOffresDto {
  @ApiProperty({ required: false, description: 'Filtrer par wilaya' })
  @IsString()
  @IsOptional()
  wilaya?: string;

  @ApiProperty({
    required: false,
    description: "Filtrer par secteur d'activité",
  })
  @IsString()
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
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Nombre de résultats par page',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
