import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';
import { StatutAO } from '@prisma/client';

@Injectable()
export class AppelOffresScheduler {
  private readonly logger = new Logger(AppelOffresScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: AoEventsPublisher,
  ) {}

  /**
   * Cron Job exécuté toutes les heures à la minute 0.
   * Recherche les AOs en statut PUBLIE ayant dépassé leur date limite de soumission,
   * puis met à jour leur statut à OUVERTURE_PLIS de manière transactionnelle et publie
   * l'événement de changement de statut correspondant.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Cron('0 * * * *')
  async handleExpiredAppelsOffres() {
    this.logger.log(
      "⏰ Début de la vérification des Appels d'Offres arrivés à échéance...",
    );

    const maintenant = new Date();

    // 1. Rechercher les appels d'offres à transitionner
    const aosExpires = await this.prisma.appelOffres.findMany({
      where: {
        statut: StatutAO.PUBLIE,
        dateLimiteSoumission: {
          lte: maintenant,
        },
      },
    });

    if (aosExpires.length === 0) {
      this.logger.log("✅ Aucun Appel d'Offres arrivé à échéance à traiter.");
      return;
    }

    this.logger.log(
      `🔍 Trouvé ${aosExpires.length} Appel(s) d'Offres à transitionner.`,
    );

    // 2. Mettre à jour transactionnellement en base et publier les événements
    for (const ao of aosExpires) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Mise à jour du statut en base de données
          await tx.appelOffres.update({
            where: { id: ao.id },
            data: { statut: StatutAO.OUVERTURE_PLIS },
          });

          this.logger.log(
            `⚙️ AO ${ao.reference} mis à jour au statut OUVERTURE_PLIS.`,
          );
        });

        // 3. Notification via RabbitMQ (publié après la validation de la transaction)
        this.publisher.publishAoStatusChanged({
          aoId: ao.id,
          ancienStatut: StatutAO.PUBLIE,
          nouveauStatut: StatutAO.OUVERTURE_PLIS,
          changedAt: new Date(),
        });

        this.logger.log(
          `📢 Événement ao.status_changed émis pour l'AO ${ao.reference} (${ao.id}).`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Erreur lors de la transition automatique de l'AO ${ao.reference} (${ao.id}) :`,
          error,
        );
      }
    }

    this.logger.log(
      "⏰ Fin du traitement des Appels d'Offres arrivés à échéance.",
    );
  }
}
