import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { UpdateAttributionDto } from './dto/update-attribution.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttributionService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAttributionDto: CreateAttributionDto) {
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
      include: { appelOffres: true },
    });
  }

  async findOne(id: string) {
    const attr = await this.prisma.attribution.findUnique({
      where: { id },
    });
    if (!attr) throw new NotFoundException(`Attribution #${id} non trouvée`);
    return attr;
  }

  update(id: string, updateAttributionDto: UpdateAttributionDto) {
    return this.prisma.attribution.update({
      where: { id },
      data: updateAttributionDto,
    });
  }

  remove(id: string) {
    return this.prisma.attribution.delete({
      where: { id },
    });
  }
}
