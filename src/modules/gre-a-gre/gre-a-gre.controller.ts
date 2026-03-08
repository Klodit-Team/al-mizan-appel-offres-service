import { Controller, Post, Body, Param, Patch, Req } from '@nestjs/common';
import { GreAGreService } from './gre-a-gre.service';
import { SubmitGreAGreDto } from './dto/submit-gre-a-gre.dto';
import { ValidateGreAGreDto } from './dto/validate-gre-a-gre.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Exceptions - Procédure Gré-à-Gré')
@Controller('appels-offres')
export class GreAGreController {
  constructor(private readonly greAGreService: GreAGreService) {}

  @Post(':id/gre-a-gre/soumettre')
  @ApiOperation({
    summary: 'Soumettre une demande de Gré-à-Gré avec ses pièces (Étape 1)',
  })
  submit(@Param('id') id: string, @Body() submitDto: SubmitGreAGreDto) {
    return this.greAGreService.submit(id, submitDto);
  }

  @Patch('gre-a-gre/:demandeId/valider')
  @ApiOperation({
    summary: 'Enregistrer la décision du Contrôleur Humain (Étape 3)',
  })
  validate(
    @Param('demandeId') demandeId: string,
    @Body() validateDto: ValidateGreAGreDto,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    // controleurId extrait du payload JWT (champ standard "sub")
    // TODO: Activer le Guard JWT (@UseGuards(JwtAuthGuard)) quand le module Auth sera branché
    const controleurId = req.user?.sub ?? 'anonymous';
    return this.greAGreService.validate(demandeId, validateDto, controleurId);
  }
}
