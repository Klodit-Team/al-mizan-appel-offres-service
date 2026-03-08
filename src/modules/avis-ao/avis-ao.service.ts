import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateAvisAoDto } from './dto/create-avis-ao.dto';
import { UpdateAvisAoDto } from './dto/update-avis-ao.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvisAoService {
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

  private async findAvisAoOrFail(id: string) {
    const avis = await this.prisma.avisAo.findUnique({
      where: { id },
    });
    if (!avis) {
      throw new NotFoundException(`Avis #${id} non trouvé`);
    }
    return avis;
  }

  // ─── Méthodes du service ──────────────
  async create(createAvisAoDto: CreateAvisAoDto) {
    const ao = await this.findAoOrFail(createAvisAoDto.aoId);

    if (ao.typeProcedure !== 'AO_OUVERT') {
      throw new BadRequestException(
        `L'Appel d'Offres avec l'ID "${createAvisAoDto.aoId}" n'est pas de type AO_OUVERT.`,
      );
    }
    return this.prisma.avisAo.create({
      data: createAvisAoDto,
    });
  }

  findAll() {
    return this.prisma.avisAo.findMany();
  }

  async findOne(id: string) {
    return this.findAvisAoOrFail(id);
  }

  async update(id: string, updateAvisAoDto: UpdateAvisAoDto) {
    const existingAvis = await this.findAvisAoOrFail(id);

    if (updateAvisAoDto.aoId && updateAvisAoDto.aoId !== existingAvis.aoId) {
      const newAo = await this.findAoOrFail(updateAvisAoDto.aoId);
      if (newAo.typeProcedure !== 'AO_OUVERT') {
        throw new BadRequestException(
          `L'Appel d'Offres avec l'ID "${updateAvisAoDto.aoId}" n'est pas de type AO_OUVERT.`,
        );
      }
    }

    return this.prisma.avisAo.update({
      where: { id },
      data: updateAvisAoDto,
    });
  }

  async remove(id: string) {
    await this.findAvisAoOrFail(id);

    return this.prisma.avisAo.delete({
      where: { id },
    });
  }
}
