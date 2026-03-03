import { ApiProperty } from '@nestjs/swagger';
import { StatutAO } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateStatutDto {
  @ApiProperty({
    enum: StatutAO,
    description: "Le nouveau statut de l'appel d'offres",
  })
  @IsEnum(StatutAO, { message: "Le statut fourni n'est pas un statut valide." })
  @IsNotEmpty({
    message: 'Le statut est obligatoire pour effectuer cette mise à jour.',
  })
  statut: StatutAO;
}
