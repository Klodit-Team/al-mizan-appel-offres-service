import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCriteresEvaluationDto } from './dto/create-criteres-evaluation.dto';
import { UpdateCriteresEvaluationDto } from './dto/update-criteres-evaluation.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CriteresEvaluationService {
  constructor(private prisma: PrismaService) {}

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

  async create(
    aoId: string,
    createCriteresEvaluationDto: CreateCriteresEvaluationDto,
  ) {
    // 1. Vérifier que l'AO existe
    const ao = await this.findAoOrFail(aoId);

    // 2. Vérifier que l'AO est au statut BROUILLON
    if (ao.statut !== 'BROUILLON') {
      throw new ConflictException(
        `Impossible d'ajouter un critère : l'AO est au statut "${ao.statut}". Seul "BROUILLON" est autorisé.`,
      );
    }

    // 3. Créer le critère
    return this.prisma.critereEvaluation.create({
      data: {
        aoId,
        ...createCriteresEvaluationDto,
      },
    });
  }

  async findAll(aoId: string) {
    // Vérifie que l'AO existe
    await this.findAoOrFail(aoId);

    // Récupère tous les critères liés à cet AO
    return this.prisma.critereEvaluation.findMany({
      where: { aoId },
    });
  }

  async findOne(aoId: string, id: string) {
    // Vérifie que l'AO existe
    await this.findAoOrFail(aoId);

    // Vérifie que le critère existe et appartient à l'AO
    const critere = await this.prisma.critereEvaluation.findUnique({
      where: { id },
    });
    if (!critere) {
      throw new NotFoundException(
        `Le critère d'évaluation avec l'ID "${id}" n'existe pas.`,
      );
    }
    return critere;
  }

  async update(
    aoId: string,
    id: string,
    _updateCriteresEvaluationDto: UpdateCriteresEvaluationDto,
  ) {
    // Vérifie que l'AO existe
    await this.findAoOrFail(aoId);

    // Vérifie que le critère existe et appartient à l'AO
    const critere = await this.prisma.critereEvaluation.findUnique({
      where: { id },
    });
    if (!critere) {
      throw new NotFoundException(
        `Le critère d'évaluation avec l'ID "${id}" n'existe pas.`,
      );
    }

    // Vérifie que le critère appartient bien à cet AO
    if (critere.aoId !== aoId) {
      throw new ConflictException(
        `Le critère "${id}" n'appartient pas à l'AO "${aoId}".`,
      );
    }

    // Met à jour le critère
    return this.prisma.critereEvaluation.update({
      where: { id },
      data: _updateCriteresEvaluationDto,
    });
  }

  async remove(aoId: string, id: string) {
    // Vérifie que l'AO existe
    await this.findAoOrFail(aoId);

    // Vérifie que le critère existe et appartient à l'AO
    const critere = await this.prisma.critereEvaluation.findUnique({
      where: { id },
    });
    if (!critere) {
      throw new NotFoundException(
        `Le critère d'évaluation avec l'ID "${id}" n'existe pas.`,
      );
    }

    // Vérifie que le critère appartient bien à cet AO
    if (critere.aoId !== aoId) {
      throw new BadRequestException(
        `Le critère "${id}" n'est pas lié à l'AO "${aoId}".`,
      );
    }

    // Supprime le critère
    return this.prisma.critereEvaluation.delete({
      where: { id },
    });
  }
}
