import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StatutAO } from '@prisma/client';
import { AppelOffresService } from '../../modules/appel-offres/appel-offres.service';
import { AoEventsPublisher } from '../publishers/ao-events.publisher';

// ─── Interfaces des payloads reçus ───────────────────────────────────────────

interface RecoursExpiredPayload {
  aoId: string;
}

// ─── Consumer ─────────────────────────────────────────────────────────────────

@Controller()
export class RecoursConsumer {
  private readonly logger = new Logger(RecoursConsumer.name);

  constructor(
    private readonly appelOffresService: AppelOffresService,
    private readonly publisher: AoEventsPublisher,
  ) {}

  /**
   * 🎧 CONSOMME : recours.periode.expired
   *
   * Émis par le Recours Service quand les 10 jours légaux de recours sont expirés.
   * Action : Fait passer l'AO de ATTRIBUE → CLOTURE (= Attribution Définitive).
   * Ensuite émet ao.attribution.definitive pour Notifications et Audit.
   */
  @EventPattern('recours.periode.expired')
  async handleRecoursExpired(
    @Payload() data: RecoursExpiredPayload,
  ): Promise<void> {
    this.logger.log(`🎧 REÇU recours.periode.expired — AO: ${data.aoId}`);

    try {
      const ao = await this.appelOffresService.findOne(data.aoId);

      // Sécurité : ne traiter que les AO en attente d'attribution définitive
      if (ao.statut !== StatutAO.ATTRIBUE) {
        this.logger.warn(
          `⚠️  AO ${data.aoId} ignoré — statut actuel : ${ao.statut} (attendu : ATTRIBUE)`,
        );
        return;
      }

      // Passer au statut CLOTURE = Attribution Définitive légale
      await this.appelOffresService.updateStatut(data.aoId, StatutAO.CLOTURE);

      this.logger.log(
        `✅  AO ${data.aoId} clôturé — Attribution Définitive confirmée.`,
      );

      // Notifier le reste du SI
      this.publisher.publishAttributionDefinitive({
        aoId: data.aoId,
        clotureAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors du traitement de recours.periode.expired pour AO ${data.aoId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
