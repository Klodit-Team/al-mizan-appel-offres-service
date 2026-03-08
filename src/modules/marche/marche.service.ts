import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateMarcheDto } from './dto/create-marche.dto';
import { UpdateMarcheDto } from './dto/update-marche.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarcheService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Méthodes utilitaires ──────────────
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

  private async findAttributionOrFail(
    attributionId: string,
    expectedAoId?: string,
  ) {
    const attr = await this.prisma.attribution.findUnique({
      where: { id: attributionId },
    });
    if (!attr) {
      throw new NotFoundException(
        `L'Attribution avec l'ID "${attributionId}" n'existe pas.`,
      );
    }
    if (expectedAoId && attr.aoId !== expectedAoId) {
      throw new BadRequestException(
        `L'Attribution "${attributionId}" n'appartient pas à l'Appel d'Offres "${expectedAoId}".`,
      );
    }
    return attr;
  }

  private async findMarcheOrFail(id: string) {
    const m = await this.prisma.marche.findUnique({
      where: { id },
    });
    if (!m) {
      throw new NotFoundException(`Le Marché #${id} n'existe pas.`);
    }
    return m;
  }

  private async checkUniqueness(
    attributionId?: string,
    referenceMarche?: string,
    excludeId?: string,
  ) {
    if (attributionId) {
      const existingMarcheByAttr = await this.prisma.marche.findUnique({
        where: { attributionId },
      });
      if (existingMarcheByAttr && existingMarcheByAttr.id !== excludeId) {
        throw new ConflictException(
          `Un Marché avec l'Attribution ID "${attributionId}" existe déjà.`,
        );
      }
    }

    if (referenceMarche) {
      const existingMarcheByRef = await this.prisma.marche.findUnique({
        where: { referenceMarche },
      });
      if (existingMarcheByRef && existingMarcheByRef.id !== excludeId) {
        throw new ConflictException(
          `Le Marché avec la référence "${referenceMarche}" existe déjà.`,
        );
      }
    }
  }

  // ─── Méthodes du service ──────────────
  async create(createMarcheDto: CreateMarcheDto) {
    // 1. Vérifier l'existence de l'AO
    await this.findAoOrFail(createMarcheDto.aoId);

    // 2. Vérifier l'existence de l'Attribution et son appartenance à l'AO
    await this.findAttributionOrFail(
      createMarcheDto.attributionId,
      createMarcheDto.aoId,
    );

    // 3. Vérifier que l'attribution et la référence de marché ne sont pas déjà utilisées
    await this.checkUniqueness(
      createMarcheDto.attributionId,
      createMarcheDto.referenceMarche,
    );

    return this.prisma.marche.create({
      data: createMarcheDto,
      include: {
        appelOffres: true,
        attribution: true,
      },
    });
  }

  findAll() {
    return this.prisma.marche.findMany({
      include: { appelOffres: true },
    });
  }

  async findOne(id: string) {
    await this.findMarcheOrFail(id);

    return this.prisma.marche.findUnique({
      where: { id },
      include: { attribution: true },
    });
  }

  async update(id: string, updateMarcheDto: UpdateMarcheDto) {
    // 1. On vérifie que le marché existe
    const existingMarche = await this.findMarcheOrFail(id);

    const aoIdToCheck = updateMarcheDto.aoId || existingMarche.aoId;

    // 2. Si l'AO change, on vérifie que le nouveau existe
    if (updateMarcheDto.aoId && updateMarcheDto.aoId !== existingMarche.aoId) {
      await this.findAoOrFail(updateMarcheDto.aoId);
    }

    // 3. Si on change l'attribution (ou que l'AO parent a changé), on vérifie l'attribution
    if (updateMarcheDto.attributionId) {
      await this.findAttributionOrFail(
        updateMarcheDto.attributionId,
        aoIdToCheck,
      );
    }

    // 4. Vérifier les conflits d'unicité avec les nouvelles valeurs
    await this.checkUniqueness(
      updateMarcheDto.attributionId,
      updateMarcheDto.referenceMarche,
      id,
    );

    return this.prisma.marche.update({
      where: { id },
      data: updateMarcheDto,
      include: {
        appelOffres: true,
        attribution: true,
      },
    });
  }

  async remove(id: string) {
    // 1. On vérifie l'existence du marché
    const existingMarche = await this.findMarcheOrFail(id);

    return this.prisma.marche.delete({
      where: { id: existingMarche.id },
    });
  }
}
