import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMarcheDto } from './dto/create-marche.dto';
import { UpdateMarcheDto } from './dto/update-marche.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarcheService {
  constructor(private readonly prisma: PrismaService) {}

  create(createMarcheDto: CreateMarcheDto) {
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
    const m = await this.prisma.marche.findUnique({
      where: { id },
      include: { attribution: true },
    });
    if (!m) throw new NotFoundException(`Marché #${id} non trouvé`);
    return m;
  }

  update(id: string, updateMarcheDto: UpdateMarcheDto) {
    return this.prisma.marche.update({
      where: { id },
      data: updateMarcheDto,
    });
  }

  remove(id: string) {
    return this.prisma.marche.delete({
      where: { id },
    });
  }
}
