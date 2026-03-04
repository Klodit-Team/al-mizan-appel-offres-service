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
  @ApiProperty()
  @IsUUID()
  aoId: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  lotId?: string;

  @ApiProperty({ description: 'ID de la soumission gagnante' })
  @IsUUID()
  soumissionId: string;

  @ApiProperty({ enum: TypeAttribution })
  @IsEnum(TypeAttribution)
  type: TypeAttribution;

  @ApiProperty()
  @IsDateString()
  dateAttribution: string;

  @ApiProperty()
  @IsDateString()
  dateFinRecours: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  montantAttribue: number;
}
