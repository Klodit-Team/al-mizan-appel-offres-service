import { CategorieCritereEvaluation } from '@prisma/client';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateCriteresEvaluationDto {
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le libellé est requis' })
  libelle: string;

  @IsEnum(CategorieCritereEvaluation, {
    message: 'La catégorie doit être une valeur valide',
  })
  @IsNotEmpty({ message: 'La catégorie est requise' })
  categorie: CategorieCritereEvaluation;

  @IsNumber({}, { message: 'Le poids doit être un nombre' })
  @Min(0, { message: 'Le poids doit être supérieur ou égal à 0' })
  @Max(100, { message: 'Le poids doit être inférieur ou égal à 100' })
  poids: number;
}
