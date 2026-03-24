import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SubmitGreAGreDto } from './dto/submit-gre-a-gre.dto';
import { ValidateGreAGreDto } from './dto/validate-gre-a-gre.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';

@Injectable()
export class GreAGreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: AoEventsPublisher,
  ) {}

  // ─── Méthode utilitaire privée (évite la duplication du 404) ──────────────
  private async findAoOrFail(aoId: string) {
    const ao = await this.prisma.appelOffres.findUnique({
      where: { id: aoId },
    });
    if (!ao) {
      throw new NotFoundException(
        `L'Appel d'Offres avec l'ID "${aoId}" n'existe pas.`,
      );
    }
    return ao;
  }

  async submit(aoId: string, submitDto: SubmitGreAGreDto) {
    const ao = await this.findAoOrFail(aoId);

    if (ao.typeProcedure !== 'GRE_A_GRE') {
      throw new BadRequestException(
        `L'Appel d'Offres avec l'ID "${aoId}" n'est pas de type GRE_A_GRE.`,
      );
    }

    // ─── Vérifier qu'il n'y a pas déjà une demande en cours ──────────────
    const demandeExistante = await this.prisma.demandeGreAGre.findUnique({
      where: { aoId },
    });

    if (demandeExistante) {
      throw new BadRequestException(
        `Une demande de Gré-à-Gré existe déjà pour cet Appel d'Offres (ID: ${demandeExistante.id}).`,
      );
    }

    // ─── Créer la demande avec les justifications ──────────────
    const demande = await this.prisma.demandeGreAGre.create({
      data: {
        aoId,
        serviceContractantId: ao.serviceContractantId,
        statut: 'SOUMISE',
        justifications: {
          create: submitDto.justifications.map((j, index) => ({
            ordre: index + 1,
            typeJustification: j.type_justification,
            description: j.description,
            documentId: j.documentId,
          })),
        },
      },
    });

    // ─── Diffuser l'événement RabbitMQ ──────────────
    const justificationText = submitDto.justifications
      .map((j) => j.description)
      .join('\n---\n');

    this.publisher.publishGreAGreSubmitted({
      gagId: demande.id,
      aoId: demande.aoId,
      justification: justificationText,
      submittedAt: demande.createdAt,
    });

    return demande;
  }

  async validate(
    demandeId: string,
    validateDto: ValidateGreAGreDto,
    controleurId: string, // On le simulera ou l'obtiendra par @Req() côté Controller
  ) {
    // 1. Trouver la demande existante
    const demande = await this.prisma.demandeGreAGre.findUnique({
      where: { id: demandeId },
      include: {
        evaluationsIa: {
          orderBy: { dateAnalyse: 'desc' },
          take: 1, // On récupère la dernière évaluation de l'IA (s'il y en a)
        },
      },
    });

    if (!demande) {
      throw new NotFoundException(
        `Demande Gré-à-Gré "${demandeId}" non trouvée.`,
      );
    }

    if (demande.statut === 'ACCEPTEE' || demande.statut === 'REJETEE') {
      throw new BadRequestException(
        `Cette demande est déjà clôturée avec le statut: ${demande.statut}`,
      );
    }

    // Corrélation avec l'IA
    const derniereEval = demande.evaluationsIa[0];
    const correspondIa = derniereEval
      ? (validateDto.decision === 'ACCEPTER' &&
          derniereEval.recommandation === 'ACCEPTER') ||
        (validateDto.decision === 'REJETER' &&
          derniereEval.recommandation === 'REJETER')
      : false; // si pas d'IA, on dit false par défaut ou on gère autrement

    // Démarrer une transaction pour s'assurer de la cohérence
    const transactionResult = await this.prisma.$transaction(async (tx) => {
      // 2. Créer l'entrée d'audit DecisionGreAGre
      const decisionEntity = await tx.decisionGreAGre.create({
        data: {
          demandeId: demande.id,
          controleurId: controleurId,
          decisionFinale: validateDto.decision,
          motifDecision: validateDto.motif,
          correspondIa: correspondIa,
          evaluationIaId: derniereEval ? derniereEval.id : null,
        },
      });

      // 3. Mettre à jour le satut de la Demande
      const nouveauStatutDemande =
        validateDto.decision === 'ACCEPTER' ? 'ACCEPTEE' : 'REJETEE';

      const updatedDemande = await tx.demandeGreAGre.update({
        where: { id: demande.id },
        data: { statut: nouveauStatutDemande },
      });

      // 4. Propulser l'Appel Offres source
      const statutAo =
        validateDto.decision === 'ACCEPTER' ? 'EN_COURS' : 'ANNULE';

      const updatedAo = await tx.appelOffres.update({
        where: { id: demande.aoId },
        data: { statut: statutAo },
      });

      return { decisionEntity, updatedDemande, updatedAo };
    });

    // 5. Notification via RabbitMQ au Service Contractant / autres microservices
    this.publisher.publishGreAGreValidated({
      gagId: transactionResult.updatedDemande.id,
      aoId: transactionResult.updatedDemande.aoId,
      decision: validateDto.decision,
      motif: validateDto.motif,
      validatedAt: transactionResult.decisionEntity.dateDecision,
    });

    return transactionResult;
  }
}
