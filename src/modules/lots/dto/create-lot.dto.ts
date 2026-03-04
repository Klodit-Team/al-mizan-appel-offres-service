import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateLotDto {
  @ApiProperty({ description: 'Numéro unique du lot' })
  @IsString({ message: 'Le numéro du lot doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le numéro du lot est requis' })
  numero: string;

  @ApiProperty({ description: 'Désignation du lot' })
  @IsString({ message: 'La désignation du lot doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La désignation du lot est requise' })
  designation: string;

  @ApiProperty({ description: 'Montant estimé du lot en MAD' })
  @IsNumber({}, { message: 'Le montant estimé doit être un nombre' })
  @Min(0, { message: 'Le montant estimé doit être supérieur ou égal à 0' })
  montantEstime: number;
}
