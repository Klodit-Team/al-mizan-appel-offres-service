import { ApiProperty } from '@nestjs/swagger';
import { TypeAvis } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateAvisAoDto {
  @ApiProperty({ description: "ID de l'Appel d'Offres" })
  @IsUUID()
  aoId: string;

  @ApiProperty({ enum: TypeAvis, description: "Type de l'avis" })
  @IsEnum(TypeAvis)
  typeAvis: TypeAvis;

  @ApiProperty({ description: "Contenu texte de l'avis pour le BOMOP" })
  @IsString({
    message: "Le contenu de l'avis doit être une chaîne de caractères",
  })
  @IsNotEmpty({ message: "Le contenu de l'avis ne peut pas être vide" })
  contenuBomop: string;

  @ApiProperty({ description: 'Date de publication prévue' })
  @IsDateString()
  datePublication: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean({ message: 'La publication doit être un booléen' })
  @IsOptional({ message: 'La publication doit être un booléen' })
  publieBomop?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean({ message: 'La publication doit être un booléen' })
  @IsOptional({ message: 'La publication doit être un booléen' })
  publiePresse?: boolean;
}
