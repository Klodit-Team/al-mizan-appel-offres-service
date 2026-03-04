import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAvisAoDto } from './dto/create-avis-ao.dto';
import { UpdateAvisAoDto } from './dto/update-avis-ao.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AvisAoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAvisAoDto: CreateAvisAoDto) {
    return this.prisma.avisAo.create({
      data: createAvisAoDto,
    });
  }

  findAll() {
    return this.prisma.avisAo.findMany();
  }

  async findOne(id: string) {
    const avis = await this.prisma.avisAo.findUnique({
      where: { id },
    });
    if (!avis) throw new NotFoundException(`Avis #${id} non trouvé`);
    return avis;
  }

  update(id: string, updateAvisAoDto: UpdateAvisAoDto) {
    return this.prisma.avisAo.update({
      where: { id },
      data: updateAvisAoDto,
    });
  }

  remove(id: string) {
    return this.prisma.avisAo.delete({
      where: { id },
    });
  }
}
