import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDemandeClarificationDto {
  @ApiProperty({
    description: "La question complémentaire posée par l'opérateur économique",
    example:
      "Est-il possible d'obtenir une prolongation pour la soumission des offres ?",
  })
  @IsNotEmpty()
  @IsString()
  question: string;
}
