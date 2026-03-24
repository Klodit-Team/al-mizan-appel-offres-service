import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GreAGreService } from '../../modules/gre-a-gre/gre-a-gre.service';
import { RecommandationIa } from '@prisma/client';

// ─── Interface du payload entrant (émis par le Service IA) ───────────────────
interface IaGreAGreScoredPayload {
  gagId: string;
  modeleIa: string;
  scoreConformite: number;
  recommandation: RecommandationIa;
  justificationIa: string;
  confianceScore: number;
}

// ─── Consumer ─────────────────────────────────────────────────────────────────

@Controller()
export class GreAGreConsumer {
  private readonly logger = new Logger(GreAGreConsumer.name);

  constructor(private readonly greAGreService: GreAGreService) {}

  /**
   * 🎧 CONSOMME : ia.gre_a_gre.scored
   *
   * Émis par le Service IA quand l'analyse de conformité d'un gré-à-gré est terminée.
   * Action : Stocke le score dans EvaluationIaGreAGre et passe la demande → EN_ANALYSE_IA.
   */
  @EventPattern('ia.gre_a_gre.scored')
  async handleIaGreAGreScored(
    @Payload() data: IaGreAGreScoredPayload,
  ): Promise<void> {
    this.logger.log(
      `🎧 REÇU ia.gre_a_gre.scored — GAG: ${data.gagId} | Score: ${data.scoreConformite} | Reco: ${data.recommandation}`,
    );

    try {
      await this.greAGreService.recordIaScore({
        gagId: data.gagId,
        modeleIa: data.modeleIa ?? 'unknown',
        scoreConformite: data.scoreConformite,
        recommandation: data.recommandation,
        justificationIa: data.justificationIa ?? '',
        confianceScore: data.confianceScore ?? 0,
      });

      this.logger.log(
        `✅ Score IA enregistré pour la demande GAG ${data.gagId} — Statut → EN_ANALYSE_IA`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de l'enregistrement du score IA pour GAG ${data.gagId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
