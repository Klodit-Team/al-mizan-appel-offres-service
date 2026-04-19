require('dotenv').config();

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding appel-offres database...');

  const ao = await prisma.appelOffres.upsert({
    where: { reference: 'AO-2026-0001' },
    update: {
      objet: 'Acquisition de fournitures informatiques',
      montantEstime: new Prisma.Decimal('15000000.00'),
      dateLimiteSoumission: new Date('2026-05-15T10:00:00.000Z'),
      dateLimiteRetraitCdc: new Date('2026-05-10T10:00:00.000Z'),
      serviceContractantId: '22222222-2222-2222-2222-222222222222',
      wilaya: 'Alger',
      secteurActivite: 'Informatique',
      typeProcedure: 'AO_OUVERT',
      statut: 'PUBLIE',
    },
    create: {
      reference: 'AO-2026-0001',
      objet: 'Acquisition de fournitures informatiques',
      typeProcedure: 'AO_OUVERT',
      montantEstime: new Prisma.Decimal('15000000.00'),
      datePublication: new Date(),
      dateLimiteSoumission: new Date('2026-05-15T10:00:00.000Z'),
      dateLimiteRetraitCdc: new Date('2026-05-10T10:00:00.000Z'),
      statut: 'PUBLIE',
      serviceContractantId: '22222222-2222-2222-2222-222222222222',
      wilaya: 'Alger',
      secteurActivite: 'Informatique',
    },
  });

  const lotCount = await prisma.lot.count({ where: { aoId: ao.id } });
  if (lotCount === 0) {
    await prisma.lot.create({
      data: {
        aoId: ao.id,
        numero: 'LOT-1',
        designation: 'Postes de travail et accessoires reseau',
        montantEstime: new Prisma.Decimal('15000000.00'),
        statut: 'OUVERT',
      },
    });
  }

  const eligibiliteCount = await prisma.critereEligibilite.count({ where: { aoId: ao.id } });
  if (eligibiliteCount === 0) {
    await prisma.critereEligibilite.create({
      data: {
        aoId: ao.id,
        libelle: 'Chiffre d affaires minimum des 3 dernieres annees',
        type: 'CA_MIN',
        valeurMinimale: '10000000',
        eliminatoire: true,
      },
    });
  }

  const evaluationCount = await prisma.critereEvaluation.count({ where: { aoId: ao.id } });
  if (evaluationCount === 0) {
    await prisma.critereEvaluation.create({
      data: {
        aoId: ao.id,
        libelle: 'Qualite de la proposition technique',
        categorie: 'TECHNIQUE',
        poids: 60,
        noteEliminatoire: 50,
      },
    });

    await prisma.critereEvaluation.create({
      data: {
        aoId: ao.id,
        libelle: 'Competitivite de l offre financiere',
        categorie: 'FINANCIER',
        poids: 40,
        noteEliminatoire: null,
      },
    });
  }

  console.log('Seed complete: 1 AO with related lot and criteria ensured.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
