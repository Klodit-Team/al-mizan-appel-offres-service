import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAppelOffreDto } from './dto/create-appel-offre.dto';
import { UpdateAppelOffreDto } from './dto/update-appel-offre.dto';
import { FindAllAppelOffresDto } from './dto/find-all-appel-offre.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { StatutAO } from '@prisma/client';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';

@Injectable()
export class AppelOffresService {
  private readonly documentServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly publisher: AoEventsPublisher,
    private readonly configService: ConfigService,
  ) {
    this.documentServiceUrl = this.configService.get<string>(
      'DOCUMENT_SERVICE_URL',
      'http://al-mizan-document-service:8005',
    );
  }

  // --------------------------------------------------------------------------
  // CRUD DE BASE
  // --------------------------------------------------------------------------

  async create(createAppelOffreDto: CreateAppelOffreDto) {
    const ao = await this.prisma.appelOffres.create({
      data: createAppelOffreDto,
    });

    // 📢 Notifier le SI qu'un AO a été créé (Audit)
    this.publisher.publishAoCreated({
      aoId: ao.id,
      typeProcedure: ao.typeProcedure,
      objet: ao.objet,
      createdAt: ao.createdAt,
    });

    return ao;
  }

  async findAll(query?: FindAllAppelOffresDto) {
    if (!query) {
      return this.prisma.appelOffres.findMany();
    }

    const {
      wilaya,
      secteurActivite,
      typeProcedure,
      statut,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: import('@prisma/client').Prisma.AppelOffresWhereInput = {};
    if (wilaya) where.wilaya = { contains: wilaya, mode: 'insensitive' };
    if (secteurActivite)
      where.secteurActivite = {
        contains: secteurActivite,
        mode: 'insensitive',
      };
    if (typeProcedure) where.typeProcedure = typeProcedure;
    if (statut) where.statut = statut;

    const [data, total] = await Promise.all([
      this.prisma.appelOffres.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appelOffres.count({ where }),
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

  async findOne(id: string) {
    const ao = await this.prisma.appelOffres.findUnique({
      where: { id },
      include: {
        lots: true,
        criteresEligibilite: true,
        criteresEvaluation: true,
      },
    });
    if (!ao) {
      throw new NotFoundException(
        `L'Appel d'Offres avec l'ID ${id} est introuvable.`,
      );
    }
    return ao;
  }

  update(id: string, updateAppelOffreDto: UpdateAppelOffreDto) {
    return this.prisma.appelOffres.update({
      where: { id },
      data: updateAppelOffreDto,
    });
  }

  remove(id: string) {
    return this.prisma.appelOffres.delete({ where: { id } });
  }

  // --------------------------------------------------------------------------
  // MACHINE À ÉTATS (avec événements RabbitMQ)
  // --------------------------------------------------------------------------

  async updateStatut(id: string, nouveauStatut: StatutAO) {
    // 1. Récupérer l'AO actuel
    const ao = await this.findOne(id);
    const statutActuel = ao.statut;

    // 2. Définition stricte de la Machine à États
    const transitionsAutorisees: Record<StatutAO, StatutAO[]> = {
      BROUILLON: [StatutAO.PUBLIE, StatutAO.ANNULE],
      PUBLIE: [StatutAO.EN_COURS, StatutAO.ANNULE],
      EN_COURS: [StatutAO.OUVERTURE_PLIS, StatutAO.ANNULE],
      OUVERTURE_PLIS: [StatutAO.EVALUATION, StatutAO.ANNULE],
      EVALUATION: [StatutAO.ATTRIBUE, StatutAO.ANNULE],
      ATTRIBUE: [StatutAO.CLOTURE, StatutAO.ANNULE],
      ANNULE: [],
      CLOTURE: [],
    };

    // 3. Vérification de la légalité de la transition
    if (!transitionsAutorisees[statutActuel].includes(nouveauStatut)) {
      throw new BadRequestException(
        `Transition de statut interdite : impossible de passer de [${statutActuel}] à [${nouveauStatut}].`,
      );
    }

    // 4. Mise à jour en base
    const updated = await this.prisma.appelOffres.update({
      where: { id },
      data: { statut: nouveauStatut },
    });

    // ─── 📢 Événement générique : toujours émis (pour l'Audit) ───────────────
    this.publisher.publishAoStatusChanged({
      aoId: id,
      ancienStatut: statutActuel,
      nouveauStatut,
      changedAt: new Date(),
    });

    // ─── 📢 Événements métier spécifiques au nouveau statut ──────────────────

    if (nouveauStatut === StatutAO.PUBLIE) {
      this.publisher.publishAoPublished({
        aoId: id,
        reference: ao.reference,
        objet: ao.objet,
        datePublication: new Date(),
      });
    }

    if (nouveauStatut === StatutAO.ATTRIBUE) {
      const dateFinRecours = new Date();
      dateFinRecours.setDate(dateFinRecours.getDate() + 10); // Art. 83 Loi 23-12

      this.publisher.publishAttributionProvisoire({
        aoId: id,
        dateFinRecours,
      });
    }

    if (nouveauStatut === StatutAO.ANNULE) {
      this.publisher.publishAoAnnule({
        aoId: id,
        annuleAt: new Date(),
      });
    }

    return updated;
  }

  // --------------------------------------------------------------------------
  // GESTION DU CDC (MINIO S3)
  // --------------------------------------------------------------------------

  /**
   * Lier un Cahier des Charges (CDC) pour l'AO correspondant.
   * Le fichier a déjà été uploadé dans le Document Service et on reçoit son documentId.
   */
  async uploadCdc(aoId: string, documentId: string, prixRetrait: number = 0) {
    // 1. Vérification Métier
    const ao = await this.findOne(aoId);

    if (ao.statut !== 'BROUILLON') {
      throw new ConflictException(
        "Impossible de modifier le CDC car l'Appel d'Offres n'est plus en BROUILLON.",
      );
    }

    // 2. Enregistrement Prisma dans DocumentCdc (lien)
    return this.prisma.documentCdc.create({
      data: {
        aoId,
        documentId,
        prixRetrait,
        publieAt: new Date(),
      },
    });
  }

  /**
   * Demande au Document Service une URL sécurisée (valide 15 minutes) pour télécharger le CDC,
   * et enregistre ce retrait dans la base de données de l'Appel d'Offres.
   */
  async getPresignedDownloadUrl(aoId: string, operateurId: string) {
    // 1. Vérification de l'AO
    await this.findOne(aoId);

    // 2. Trouver le document le plus récent associé à cet AO
    const document = await this.prisma.documentCdc.findFirst({
      where: { aoId },
      orderBy: { publieAt: 'desc' },
    });

    if (!document) {
      throw new NotFoundException(
        "Aucun Cahier des Charges (CDC) n'a été trouvé pour cet Appel d'Offres.",
      );
    }

    // 3. Obtenir l'URL de téléchargement depuis le Document Service via HTTP
    // (Dans un cluster Docker, le nom du service "document-service" est résolu par DNS)
    let presignedUrl = '';
    try {
      const response = await firstValueFrom<{ data: { url: string } }>(
        this.httpService.get(
          `${this.documentServiceUrl}/api/documents/${document.documentId}/download`,
        ),
      );
      presignedUrl = String(response.data.url);
    } catch {
      throw new ConflictException(
        "Erreur lors de la communication avec le Document Service pour récupérer l'URL du fichier.",
      );
    }

    // 4. Traçabilité : Enregistrer que l'Opérateur a retiré le CDC
    await this.prisma.retraitCdc.create({
      data: {
        documentCdcId: document.id,
        operateurId,
      },
    });

    return { downloadUrl: presignedUrl, documentId: document.documentId };
  }
}
