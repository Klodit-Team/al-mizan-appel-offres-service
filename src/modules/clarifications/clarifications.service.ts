import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';
import { StatutAO } from '@prisma/client';

@Injectable()
export class ClarificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: AoEventsPublisher,
  ) {}

  /**
   * Crée une demande de clarification complémentaire posée par un Opérateur Économique.
   */
  async create(aoId: string, operateurId: string, question: string) {
    const ao = await this.prisma.appelOffres.findUnique({
      where: { id: aoId },
    });

    if (!ao) {
      throw new NotFoundException(`Appel d'offres introuvable : ${aoId}`);
    }

    // Règle métier : Ne pas soumettre de question si l'AO est clos (CLOTURE ou OUVERTURE_PLIS)
    if (
      ao.statut === StatutAO.CLOTURE ||
      ao.statut === StatutAO.OUVERTURE_PLIS
    ) {
      throw new ConflictException(
        "Le statut de l'appel d'offres ne permet pas de soumettre de nouvelles demandes de clarification.",
      );
    }

    return this.prisma.demandeClarification.create({
      data: {
        aoId,
        operateurId,
        question,
      },
    });
  }

  /**
   * Renvoie la liste de toutes les clarifications et réponses pour un AO donné.
   */
  async findAllByAo(aoId: string) {
    const ao = await this.prisma.appelOffres.findUnique({
      where: { id: aoId },
    });

    if (!ao) {
      throw new NotFoundException(`Appel d'offres introuvable : ${aoId}`);
    }

    return this.prisma.demandeClarification.findMany({
      where: { aoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Permet au Service Contractant de répondre à une demande de clarification.
   */
  async repondre(
    aoId: string,
    id: string,
    serviceContractantId: string,
    reponse: string,
  ) {
    const ao = await this.prisma.appelOffres.findUnique({
      where: { id: aoId },
    });

    if (!ao) {
      throw new NotFoundException(`Appel d'offres introuvable : ${aoId}`);
    }

    const clarification = await this.prisma.demandeClarification.findUnique({
      where: { id },
    });

    if (!clarification || clarification.aoId !== aoId) {
      throw new NotFoundException(
        `Demande de clarification introuvable pour cet appel d'offres.`,
      );
    }

    const updated = await this.prisma.demandeClarification.update({
      where: { id },
      data: {
        reponse,
        reponduAt: new Date(),
      },
    });

    // Émettre l'événement RabbitMQ de clarification répondue
    this.publisher.publishClarificationRepondue({
      aoId,
      clarificationId: updated.id,
      question: updated.question,
      reponse: updated.reponse!,
      reponduAt: updated.reponduAt!,
    });

    return updated;
  }
}
