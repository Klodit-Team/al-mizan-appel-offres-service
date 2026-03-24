import { RecommandationIa } from '@prisma/client';
import { IsEnum, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload reçu depuis le Service IA via RabbitMQ (event: ia.gre_a_gre.scored).
 * Peut aussi être utilisé via un endpoint HTTP interne pour les tests / simulations.
 */
export class ScoreIaGreAGreDto {
  @ApiProperty({ description: 'UUID de la demande Gré-à-Gré analysée' })
  @IsUUID('4', { message: 'L\'UUID de la demande doit être valide' })
  gagId: string;

  @ApiProperty({ description: 'Nom/version du modèle IA utilisé (ex: gpt-4o, mistral-7b)' })
  @IsString({ message: 'Le nom du modèle IA doit être une chaîne de caractères' })
  modeleIa: string;

  @ApiProperty({ description: 'Score de conformité de 0 à 100', minimum: 0, maximum: 100 })
  @IsNumber({}, { message: 'Le score de conformité doit être un nombre' })
  @Min(0, { message: 'Le score de conformité doit être supérieur ou égal à 0' })
  @Max(100, { message: 'Le score de conformité doit être inférieur ou égal à 100' })
  scoreConformite: number;

  @ApiProperty({ enum: RecommandationIa })
  @IsEnum(RecommandationIa, { message: 'La recommandation doit être APPROUVER ou REJETER' })
  recommandation: RecommandationIa;

  @ApiProperty({ description: 'Justification textuelle produite par le modèle IA' })
  @IsString({ message: 'La justification doit être une chaîne de caractères' })
  justificationIa: string;

  @ApiProperty({ description: 'Score de confiance du modèle (0 à 100)', minimum: 0, maximum: 100 })
  @IsNumber({}, { message: 'Le score de confiance doit être un nombre' })
  @Min(0, { message: 'Le score de confiance doit être supérieur ou égal à 0' })
  @Max(100, { message: 'Le score de confiance doit être inférieur ou égal à 100' })
  confianceScore: number;
}
