import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLotDto } from './dto/create-lot.dto';

@Injectable()
export class LotsService {
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

  async create(aoId: string, createLotDto: CreateLotDto) {
    // 1. Vérifier que l'AO parent existe
    const ao = await this.findAoOrFail(aoId);

    // 2. Vérifier que l'AO est au statut BROUILLON
    if (ao.statut !== 'BROUILLON') {
      throw new ConflictException(
        `Impossible d'ajouter un lot : l'AO est au statut "${ao.statut}". Seul le statut "BROUILLON" est autorisé.`,
      );
    }

    // 3. Créer le lot dans la BDD
    return this.prisma.lot.create({
      data: {
        aoId,
        numero: createLotDto.numero,
        designation: createLotDto.designation,
        montantEstime: createLotDto.montantEstime,
      },
    });
  }

  /**
   * Récupère tous les lots d'un Appel d'Offres.
   */
  async findAll(aoId: string) {
    // Vérifie que l'AO existe (lève NotFoundException s'il n'existe pas)
    await this.findAoOrFail(aoId);

    return this.prisma.lot.findMany({
      where: { aoId },
      orderBy: { numero: 'asc' },
    });
  }
}
