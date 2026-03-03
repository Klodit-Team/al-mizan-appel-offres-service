import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateAppelOffreDto } from './dto/create-appel-offre.dto';
import { UpdateAppelOffreDto } from './dto/update-appel-offre.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { StatutAO } from '@prisma/client';

@Injectable()
export class AppelOffresService {
  constructor(private readonly prisma: PrismaService) { }
  create(createAppelOffreDto: CreateAppelOffreDto) {
    return this.prisma.appelOffres.create({ data: createAppelOffreDto });
  }

  findAll() {
    return this.prisma.appelOffres.findMany();
  }

  async findOne(id: string) {
    const ao = await this.prisma.appelOffres.findUnique({ where: { id } });
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

  async updateStatut(id: string, nouveauStatut: StatutAO) {
    // 1. On récupère d'abord l'AO actuel
    const ao = await this.findOne(id);
    const statutActuel = ao.statut;

    // 2. Définition stricte de la Machine à États selon tes règles
    const transitionsAutorisees: Record<StatutAO, StatutAO[]> = {
      BROUILLON: [StatutAO.PUBLIE, StatutAO.ANNULE],
      PUBLIE: [StatutAO.EN_COURS, StatutAO.ANNULE],
      EN_COURS: [StatutAO.OUVERTURE_PLIS, StatutAO.ANNULE],
      OUVERTURE_PLIS: [StatutAO.EVALUATION, StatutAO.ANNULE],
      EVALUATION: [StatutAO.ATTRIBUE, StatutAO.ANNULE],
      ATTRIBUE: [StatutAO.CLOTURE, StatutAO.ANNULE],
      ANNULE: [], // Un AO annulé est figé
      CLOTURE: [], // Un AO clôturé est figé
    };

    // 3. Vérification de la légalité du changement
    const estAutorise =
      transitionsAutorisees[statutActuel].includes(nouveauStatut);

    if (!estAutorise) {
      throw new BadRequestException(
        `Transition de statut interdite : impossible de passer de [${statutActuel}] à [${nouveauStatut}].`,
      );
    }

    // 4. Tout est bon, on met à jour !
    return this.prisma.appelOffres.update({
      where: { id },
      data: { statut: nouveauStatut },
    });
  }
}
