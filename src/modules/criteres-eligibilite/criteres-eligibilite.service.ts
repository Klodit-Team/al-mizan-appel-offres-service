import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateCriteresEligibiliteDto } from './dto/create-criteres-eligibilite.dto';
import { UpdateCriteresEligibiliteDto } from './dto/update-criteres-eligibilite.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CriteresEligibiliteService {
  constructor(private readonly prisma: PrismaService) {}

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

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(
    aoId: string,
    createCriteresEligibiliteDto: CreateCriteresEligibiliteDto,
  ) {
    // 1. Vérifier que l'AO existe
    const ao = await this.findAoOrFail(aoId);

    // 2. Règle métier : l'AO doit être BROUILLON
    if (ao.statut !== 'BROUILLON') {
      throw new ConflictException(
        `Impossible d'ajouter un critère : l'AO est au statut "${ao.statut}". Seul "BROUILLON" est autorisé.`,
      );
    }

    // 3. Insérer en base
    return this.prisma.critereEligibilite.create({
      data: {
        aoId,
        libelle: createCriteresEligibiliteDto.libelle,
        type: createCriteresEligibiliteDto.type,
        valeurMinimale: createCriteresEligibiliteDto.valeurMinimale,
      },
    });
  }

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  async findAll(aoId: string) {
    // Vérifie que l'AO existe
    await this.findAoOrFail(aoId);

    return this.prisma.critereEligibilite.findMany({
      where: { aoId },
    });
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────
  async findOne(aoId: string, id: string) {
    await this.findAoOrFail(aoId);

    const critere = await this.prisma.critereEligibilite.findFirst({
      where: { id, aoId },
    });

    if (!critere) {
      throw new NotFoundException(
        `Critère d'éligibilité avec l'ID "${id}" introuvable sur cet AO.`,
      );
    }
    return critere;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(
    aoId: string,
    id: string,
    updateCriteresEligibiliteDto: UpdateCriteresEligibiliteDto,
  ) {
    // Vérifie l'existence du critère sur cet AO (lance 404 si besoin)
    await this.findOne(aoId, id);

    return this.prisma.critereEligibilite.update({
      where: { id },
      data: updateCriteresEligibiliteDto,
    });
  }

  // ─── REMOVE ───────────────────────────────────────────────────────────────
  async remove(aoId: string, id: string) {
    // Vérifie l'existence du critère sur cet AO (lance 404 si besoin)
    await this.findOne(aoId, id);

    return this.prisma.critereEligibilite.delete({
      where: { id },
    });
  }
}
