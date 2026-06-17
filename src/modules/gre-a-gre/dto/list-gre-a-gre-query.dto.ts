import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { StatutDemandeGreAGre } from '@prisma/client';

export class ListGreAGreQueryDto {
  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page (max 50)",
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrer par statut de la demande',
    enum: StatutDemandeGreAGre,
  })
  @IsOptional()
  @IsEnum(StatutDemandeGreAGre)
  statut?: StatutDemandeGreAGre;

  @ApiPropertyOptional({ description: "Filtrer par ID d'Appel d'Offres" })
  @IsOptional()
  @IsUUID()
  aoId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par ID de Service Contractant' })
  @IsOptional()
  @IsUUID()
  serviceContractantId?: string;
}
