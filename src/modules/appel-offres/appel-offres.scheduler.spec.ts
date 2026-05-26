/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { AppelOffresScheduler } from './appel-offres.scheduler';
import { PrismaService } from '../../prisma/prisma.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';
import { StatutAO } from '@prisma/client';

describe('AppelOffresScheduler', () => {
  let scheduler: AppelOffresScheduler;
  let prisma: any;
  let publisher: any;

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    appelOffres: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAoEventsPublisher = {
    publishAoStatusChanged: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppelOffresScheduler,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AoEventsPublisher, useValue: mockAoEventsPublisher },
      ],
    }).compile();

    scheduler = module.get<AppelOffresScheduler>(AppelOffresScheduler);
    prisma = module.get<PrismaService>(PrismaService);
    publisher = module.get<AoEventsPublisher>(AoEventsPublisher);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('handleExpiredAppelsOffres', () => {
    it('doit ne rien faire si aucun appel d offres n est expire', async () => {
      prisma.appelOffres.findMany.mockResolvedValueOnce([]);

      await scheduler.handleExpiredAppelsOffres();

      expect(prisma.appelOffres.findMany).toHaveBeenCalledWith({
        where: {
          statut: StatutAO.PUBLIE,
          dateLimiteSoumission: {
            lte: expect.any(Date),
          },
        },
      });
      expect(prisma.appelOffres.update).not.toHaveBeenCalled();
      expect(publisher.publishAoStatusChanged).not.toHaveBeenCalled();
    });

    it('doit mettre a jour le statut et publier l evenement pour chaque AO expire', async () => {
      const mockAo = {
        id: 'ao-uuid-1',
        reference: 'AO-2026-001',
        statut: StatutAO.PUBLIE,
      };

      prisma.appelOffres.findMany.mockResolvedValueOnce([mockAo]);
      prisma.appelOffres.update.mockResolvedValueOnce({
        ...mockAo,
        statut: StatutAO.OUVERTURE_PLIS,
      });

      await scheduler.handleExpiredAppelsOffres();

      expect(prisma.appelOffres.findMany).toHaveBeenCalled();
      expect(prisma.appelOffres.update).toHaveBeenCalledWith({
        where: { id: mockAo.id },
        data: { statut: StatutAO.OUVERTURE_PLIS },
      });
      expect(publisher.publishAoStatusChanged).toHaveBeenCalledWith({
        aoId: mockAo.id,
        ancienStatut: StatutAO.PUBLIE,
        nouveauStatut: StatutAO.OUVERTURE_PLIS,
        changedAt: expect.any(Date),
      });
    });

    it('doit capturer les erreurs individuelles et continuer le traitement des autres AOs', async () => {
      const mockAo1 = {
        id: 'ao-1',
        reference: 'AO-1',
        statut: StatutAO.PUBLIE,
      };
      const mockAo2 = {
        id: 'ao-2',
        reference: 'AO-2',
        statut: StatutAO.PUBLIE,
      };

      prisma.appelOffres.findMany.mockResolvedValueOnce([mockAo1, mockAo2]);

      // La première mise à jour échoue
      prisma.appelOffres.update.mockRejectedValueOnce(
        new Error('Erreur DB transactionnelle'),
      );

      // La deuxième mise à jour réussit
      prisma.appelOffres.update.mockResolvedValueOnce({
        ...mockAo2,
        statut: StatutAO.OUVERTURE_PLIS,
      });

      await scheduler.handleExpiredAppelsOffres();

      expect(prisma.appelOffres.update).toHaveBeenCalledTimes(2);
      expect(publisher.publishAoStatusChanged).toHaveBeenCalledTimes(1);
      expect(publisher.publishAoStatusChanged).toHaveBeenCalledWith({
        aoId: mockAo2.id,
        ancienStatut: StatutAO.PUBLIE,
        nouveauStatut: StatutAO.OUVERTURE_PLIS,
        changedAt: expect.any(Date),
      });
    });
  });
});
