import { ApiProperty } from '@nestjs/swagger';
import { StatutDemandeGreAGre } from '@prisma/client';
import { AppelOffre } from '../../appel-offres/entities/appel-offre.entity';

export class DemandeGreAGre {
  @ApiProperty() id: string;
  @ApiProperty() aoId: string;
  @ApiProperty() serviceContractantId: string;
  @ApiProperty({ enum: StatutDemandeGreAGre }) statut: StatutDemandeGreAGre;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ValidateGreAGreResponse {
  @ApiProperty() decisionEntity: any;
  @ApiProperty({ type: DemandeGreAGre }) updatedDemande: DemandeGreAGre;
  @ApiProperty({ type: AppelOffre }) updatedAo: AppelOffre;
}
