import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
} from 'class-validator';

export class CreateMarcheDto {
  @ApiProperty()
  @IsUUID()
  aoId: string;

  @ApiProperty()
  @IsUUID()
  attributionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  referenceMarche: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  montantSigne: number;

  @ApiProperty()
  @IsDateString()
  dateSignature: string;

  @ApiProperty({ description: 'Délai exécution en jours' })
  @IsInt()
  @IsPositive()
  delaiExecution: number;
}
