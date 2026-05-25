import { Controller, Post, Body, Param, Patch, Req } from '@nestjs/common';
import { GreAGreService } from './gre-a-gre.service';
import { SubmitGreAGreDto } from './dto/submit-gre-a-gre.dto';
import { ValidateGreAGreDto } from './dto/validate-gre-a-gre.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import {
  DemandeGreAGre,
  ValidateGreAGreResponse,
} from './entities/demande-gre-a-gre.entity';

@ApiTags('Exceptions - Procédure Gré-à-Gré')
@Controller('appels-offres')
export class GreAGreController {
  constructor(private readonly greAGreService: GreAGreService) {}

  @Post(':id/gre-a-gre/soumettre')
  @ApiOperation({
    summary: 'Soumettre une demande de Gré-à-Gré avec ses pièces (Étape 1)',
    description:
      "Permet d'initier un dossier dérogatoire de Gré-à-Gré pour un Appel d'Offres spécifique en fournissant les pièces justificatives obligatoires.",
  })
  @ApiParam({
    name: 'id',
    description: "UUID de l'Appel d'Offres de type GRE_A_GRE",
    type: String,
  })
  @ApiResponse({
    status: 201,
    description:
      'La demande de Gré-à-Gré a été initiée et le workflow IA a été déclenché.',
    type: DemandeGreAGre,
  })
  @ApiResponse({
    status: 400,
    description:
      "Données d'entrée invalides ou pièces obligatoires manquantes.",
  })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  @ApiResponse({
    status: 409,
    description:
      "Une demande de Gré-à-Gré est déjà active pour cet Appel d'Offres.",
  })
  submit(@Param('id') id: string, @Body() submitDto: SubmitGreAGreDto) {
    return this.greAGreService.submit(id, submitDto);
  }

  @Patch('gre-a-gre/:demandeId/valider')
  @ApiOperation({
    summary: 'Enregistrer la décision du Contrôleur Humain (Étape 3)',
    description:
      "Permet au Contrôleur Humain de rendre sa décision finale sur la demande de Gré-à-Gré, après comparaison avec les scores recommandés par l'IA.",
  })
  @ApiParam({
    name: 'demandeId',
    description: 'UUID unique de la demande de Gré-à-Gré',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description:
      "La décision a été enregistrée avec succès et le statut de l'AO a été mis à jour.",
    type: ValidateGreAGreResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Décision invalide ou paramètres de validation incorrects.',
  })
  @ApiResponse({
    status: 404,
    description: 'La demande de Gré-à-Gré est introuvable.',
  })
  validate(
    @Param('demandeId') demandeId: string,
    @Body() validateDto: ValidateGreAGreDto,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    const controleurId = req.user?.sub ?? 'anonymous';
    return this.greAGreService.validate(demandeId, validateDto, controleurId);
  }
}
