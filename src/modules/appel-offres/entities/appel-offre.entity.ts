import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutAO, TypeProcedure } from '@prisma/client';

export class AppelOffre {
  @ApiProperty() id: string;
  @ApiProperty() reference: string;
  @ApiProperty() objet: string;
  @ApiProperty({ enum: TypeProcedure }) typeProcedure: TypeProcedure;
  @ApiProperty() montantEstime: number;
  @ApiPropertyOptional() datePublication: Date | null;
  @ApiProperty() dateLimiteSoumission: Date;
  @ApiProperty() dateLimiteRetraitCdc: Date;
  @ApiProperty({ enum: StatutAO }) statut: StatutAO;
  @ApiProperty() serviceContractantId: string;
  @ApiProperty() wilaya: string;
  @ApiProperty() secteurActivite: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
