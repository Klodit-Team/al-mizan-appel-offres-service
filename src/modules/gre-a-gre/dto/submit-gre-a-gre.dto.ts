import { TypeJustificationGreAGre } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JustificationGreAGreDto {
  @ApiProperty({ enum: TypeJustificationGreAGre })
  @IsEnum(TypeJustificationGreAGre)
  type_justification: TypeJustificationGreAGre;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsUUID('4', { message: 'Doit être un UUID valide (Document Service)' })
  @IsOptional()
  documentId?: string;
}

export class SubmitGreAGreDto {
  @ApiProperty({
    type: [JustificationGreAGreDto],
    description: 'Liste structurée des documents et raisons justificatives.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JustificationGreAGreDto)
  justifications: JustificationGreAGreDto[];
}
