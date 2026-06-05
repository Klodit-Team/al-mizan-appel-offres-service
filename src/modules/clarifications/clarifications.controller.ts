import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ClarificationsService } from './clarifications.service';
import { CreateDemandeClarificationDto } from './dto/create-demande-clarification.dto';
import { RepondreClarificationDto } from './dto/repondre-clarification.dto';
import { Request } from 'express';

@ApiTags('Clarifications CDC')
@Controller('appels-offres')
export class ClarificationsController {
  constructor(private readonly clarificationsService: ClarificationsService) {}

  @Post(':aoId/clarifications')
  @ApiOperation({
    summary: 'Poser une question de clarification sur un CDC',
    description:
      "Permet à un Opérateur Économique de poser une question complémentaire concernant le Cahier des Charges (CDC) d'un Appel d'Offres publié.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'La demande de clarification a été créée avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: "Données d'entrée invalides.",
  })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  @ApiResponse({
    status: 409,
    description:
      "Le statut de l'Appel d'Offres est clos et ne permet pas de poser de questions.",
  })
  async create(
    @Param('aoId') aoId: string,
    @Headers('x-user-id') userIdHeader: string,
    @Req() req: Request & { user?: { sub: string } },
    @Body() dto: CreateDemandeClarificationDto,
  ) {
    const operateurId = userIdHeader || req.user?.sub || 'anonymous';
    return this.clarificationsService.create(aoId, operateurId, dto.question);
  }

  @Get(':aoId/clarifications')
  @ApiOperation({
    summary: 'Lister les questions et réponses de clarification pour un AO',
    description:
      'Permet de consulter toutes les demandes de clarification et leurs réponses associées pour un AO donné.',
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des clarifications récupérée avec succès.',
  })
  @ApiResponse({
    status: 404,
    description: "L'Appel d'Offres est introuvable.",
  })
  async findAll(@Param('aoId') aoId: string) {
    return this.clarificationsService.findAllByAo(aoId);
  }

  @Put(':aoId/clarifications/:id/repondre')
  @ApiOperation({
    summary: 'Répondre à une demande de clarification',
    description:
      "Permet au Service Contractant d'apporter une réponse publique officielle à une question de clarification posée par un opérateur.",
  })
  @ApiParam({
    name: 'aoId',
    description: "UUID unique de l'Appel d'Offres",
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'UUID unique de la demande de clarification',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'La réponse a été enregistrée et publiée avec succès.',
  })
  @ApiResponse({
    status: 404,
    description:
      "L'Appel d'Offres ou la demande de clarification est introuvable.",
  })
  async repondre(
    @Param('aoId') aoId: string,
    @Param('id') id: string,
    @Headers('x-user-id') userIdHeader: string,
    @Req() req: Request & { user?: { sub: string } },
    @Body() dto: RepondreClarificationDto,
  ) {
    const serviceContractantId = userIdHeader || req.user?.sub || 'anonymous';
    return this.clarificationsService.repondre(
      aoId,
      id,
      serviceContractantId,
      dto.reponse,
    );
  }
}
