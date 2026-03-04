import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TypeCritereEligibilite } from '@prisma/client';

export class CreateCriteresEligibiliteDto {
  @ApiProperty({
    description: "Libellé du critère d'éligibilité",
    example: "Chiffre d'affaires minimum",
  })
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le libellé est requis' })
  libelle: string;

  @ApiProperty({
    description: "Type de critère d'éligibilité",
    enum: TypeCritereEligibilite,
    example: TypeCritereEligibilite.CA_MIN,
  })
  @IsEnum(TypeCritereEligibilite, {
    message: `Le type de critère doit être l'une des valeurs suivantes : ${Object.values(TypeCritereEligibilite).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Le type de critère est requis' })
  type: TypeCritereEligibilite;

  @ApiProperty({
    description: "Valeur minimale requise pour le critère d'éligibilité",
    example: '1000000',
  })
  @IsString({
    message: 'La valeur minimale doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'La valeur minimale est requise' })
  valeurMinimale: string;
}
