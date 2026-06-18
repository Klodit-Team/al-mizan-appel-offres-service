import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { SubmitGreAGreDto } from './dto/submit-gre-a-gre.dto';
import { ValidateGreAGreDto } from './dto/validate-gre-a-gre.dto';
import { ScoreIaGreAGreDto } from './dto/score-ia-gre-a-gre.dto';
import { ListGreAGreQueryDto } from './dto/list-gre-a-gre-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';

@Injectable()
export class GreAGreService {
  private readonly logger = new Logger(GreAGreService.name);
  private readonly auditBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: AoEventsPublisher,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.auditBaseUrl = this.configService.get<string>(
      'AUDIT_BASE_URL',
      this.configService.get<string>('AUDIT_SERVICE_URL', 'http://localhost:3009'),
    );
  }

  async findAll(query: ListGreAGreQueryDto) {
    const { page = 1, limit = 10, statut, aoId, serviceContractantId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DemandeGreAGreWhereInput = {};
    if (statut) where.statut = statut;
    if (aoId) where.aoId = aoId;
    if (serviceContractantId) where.serviceContractantId = serviceContractantId;

    const [data, total] = await Promise.all([
      this.prisma.demandeGreAGre.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appelOffres: true,
          justifications: true,
          evaluationsIa: { orderBy: { dateAnalyse: 'desc' }, take: 1 },
          decisions: { orderBy: { dateDecision: 'desc' }, take: 1 },
        },
      }),
      this.prisma.demandeGreAGre.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(demandeId: string) {
    const demande = await this.prisma.demandeGreAGre.findUnique({
      where: { id: demandeId },
      include: {
        appelOffres: true,
        justifications: { orderBy: { ordre: 'asc' } },
        evaluationsIa: { orderBy: { dateAnalyse: 'desc' }, take: 1 },
        decisions: { orderBy: { dateDecision: 'desc' }, take: 1 },
      },
    });

    if (!demande) {
      throw new NotFoundException(
        `Demande Gré-à-Gré "${demandeId}" non trouvée.`,
      );
    }

    return demande;
  }

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
      userId: demande.serviceContractantId,
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

    if (
      validateDto.decision === 'ACCEPTER' &&
      derniereEval?.recommandation === 'REJETER'
    ) {
      await this.raiseAcceptedAfterIaRefusalIncident({
        demandeId: demande.id,
        aoId: demande.aoId,
        modeleIa: derniereEval.modeleIa,
        decisionHumaine: validateDto.decision,
        confianceIa: Number(derniereEval.confianceScore),
        scoreConformite: Number(derniereEval.scoreConformite),
      });
    }

    return transactionResult;
  }

  private async raiseAcceptedAfterIaRefusalIncident(input: {
    demandeId: string;
    aoId: string;
    modeleIa: string;
    decisionHumaine: string;
    confianceIa: number;
    scoreConformite: number;
  }) {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.auditBaseUrl}/incidents`, {
          type_incident: 'DIVERGENCE_GRE_A_GRE',
          entite_source: 'demandes_gre_a_gre',
          entite_id: input.demandeId,
          modele_ia: input.modeleIa || 'gre-a-gre-agent',
          decision_ia: 'REJETER',
          decision_humaine: input.decisionHumaine,
          ecart_score: Number.isFinite(input.scoreConformite)
            ? Math.max(0, Math.min(100, 100 - input.scoreConformite)) / 100
            : undefined,
          confiance_ia: Number.isFinite(input.confianceIa)
            ? Math.max(0, Math.min(1, input.confianceIa > 1 ? input.confianceIa / 100 : input.confianceIa))
            : undefined,
          gravite: 'CRITIQUE',
          date_detection: new Date().toISOString(),
        }),
      );
      this.logger.warn(
        `Incident IA créé pour acceptation humaine malgré refus IA — GAG ${input.demandeId} | AO ${input.aoId}`,
      );
    } catch (error) {
      this.logger.error(
        `Impossible de créer l'incident IA pour GAG ${input.demandeId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // ─── US 12 : Enregistrement du score IA ──────────────────────────────────
  async recordIaScore(dto: ScoreIaGreAGreDto) {
    // 1. Vérifier que la demande existe
    const demande = await this.prisma.demandeGreAGre.findUnique({
      where: { id: dto.gagId },
    });

    if (!demande) {
      throw new NotFoundException(
        `Demande Gré-à-Gré "${dto.gagId}" introuvable. Impossible d'enregistrer le score IA.`,
      );
    }

    if (demande.statut === 'ACCEPTEE' || demande.statut === 'REJETEE') {
      throw new BadRequestException(
        `Cette demande est déjà clôturée (${demande.statut}). Impossible d'enregistrer un score IA.`,
      );
    }

    // 2. Créer l'entrée d'audit EvaluationIaGreAGre
    const evaluation = await this.prisma.evaluationIaGreAGre.create({
      data: {
        demandeId: dto.gagId,
        modeleIa: dto.modeleIa,
        scoreConformite: dto.scoreConformite,
        recommandation: dto.recommandation,
        justificationIa: dto.justificationIa,
        criteresAnalyses: {},
        confianceScore: dto.confianceScore,
      },
    });

    // 3. Mettre à jour le statut de la demande → EN_ANALYSE_IA
    await this.prisma.demandeGreAGre.update({
      where: { id: dto.gagId },
      data: { statut: 'EN_ANALYSE_IA' },
    });

    return evaluation;
  }
}
