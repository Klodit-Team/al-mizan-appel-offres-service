import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { UpdateAttributionDto } from './dto/update-attribution.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttributionService {
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

  private async findLotOrFail(lotId: string, expectedAoId?: string) {
    const lot = await this.prisma.lot.findUnique({
      where: { id: lotId },
    });
    if (!lot) {
      throw new NotFoundException(`Le Lot avec l'ID "${lotId}" n'existe pas.`);
    }
    if (expectedAoId && lot.aoId !== expectedAoId) {
      throw new BadRequestException(
        `Le Lot "${lotId}" n'appartient pas à l'Appel d'Offres "${expectedAoId}".`,
      );
    }
    return lot;
  }

  private async findAttributionOrFail(id: string) {
    const attr = await this.prisma.attribution.findUnique({
      where: { id },
    });
    if (!attr) {
      throw new NotFoundException(`L'Attribution #${id} n'existe pas.`);
    }
    return attr;
  }

  // ─── Méthodes du service ──────────────
  async create(createAttributionDto: CreateAttributionDto) {
    // 1. Vérifier l'existence de l'AO
    await this.findAoOrFail(createAttributionDto.aoId);

    // 2. Si un lotId est fourni, vérifier son existence et son appartenance à l'AO
    if (createAttributionDto.lotId) {
      await this.findLotOrFail(
        createAttributionDto.lotId,
        createAttributionDto.aoId,
      );
    }

    return this.prisma.attribution.create({
      data: createAttributionDto,
      include: {
        appelOffres: true,
        lot: true,
      },
    });
  }

  findAll() {
    return this.prisma.attribution.findMany({
      include: { appelOffres: true, lot: true },
    });
  }

  async findOne(id: string) {
    await this.findAttributionOrFail(id);

    return this.prisma.attribution.findUnique({
      where: { id },
      include: { appelOffres: true, lot: true },
    });
  }

  async update(id: string, updateAttributionDto: UpdateAttributionDto) {
    // 1. On vérifie que l'attribution existe
    const existingAttr = await this.findAttributionOrFail(id);

    const aoIdToCheck = updateAttributionDto.aoId || existingAttr.aoId;

    // 2. Si l'AO change, on vérifie que le nouveau existe
    if (
      updateAttributionDto.aoId &&
      updateAttributionDto.aoId !== existingAttr.aoId
    ) {
      await this.findAoOrFail(updateAttributionDto.aoId);
    }

    // 3. Si on met à jour le lot (ou qu'on a juste changé d'AO parent), on croise les données
    if (updateAttributionDto.lotId) {
      await this.findLotOrFail(updateAttributionDto.lotId, aoIdToCheck);
    }

    return this.prisma.attribution.update({
      where: { id },
      data: updateAttributionDto,
      include: {
        appelOffres: true,
        lot: true,
      },
    });
  }

  async remove(id: string) {
    // 1. On s'assure que l'attribution existe avant de la supprimer
    const existingAttr = await this.findAttributionOrFail(id);

    return this.prisma.attribution.delete({
      where: { id: existingAttr.id },
    });
  }
}
