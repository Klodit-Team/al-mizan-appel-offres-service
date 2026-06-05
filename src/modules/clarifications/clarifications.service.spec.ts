import { Test, TestingModule } from '@nestjs/testing';
import { ClarificationsService } from './clarifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StatutAO } from '@prisma/client';

const MOCK_AO_ID = 'ao-uuid-1';
const MOCK_CLARIF_ID = 'clarif-uuid-1';

const mockAo = {
  id: MOCK_AO_ID,
  statut: StatutAO.PUBLIE,
};

const mockClarification = {
  id: MOCK_CLARIF_ID,
  aoId: MOCK_AO_ID,
  operateurId: 'operateur-uuid',
  question: 'Est-il possible de prolonger le délai ?',
  reponse: null,
  reponduAt: null,
};

const mockPrismaService = {
  appelOffres: {
    findUnique: jest.fn(),
  },
  demandeClarification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockAoEventsPublisher = {
  publishClarificationRepondue: jest.fn(),
};

describe('ClarificationsService', () => {
  let service: ClarificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClarificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AoEventsPublisher, useValue: mockAoEventsPublisher },
      ],
    }).compile();

    service = module.get<ClarificationsService>(ClarificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it("devrait créer une demande de clarification si l'AO est valide et ouvert", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.demandeClarification.create.mockResolvedValue(
        mockClarification,
      );

      const result = await service.create(
        MOCK_AO_ID,
        'operateur-uuid',
        'Ma question',
      );

      expect(mockPrismaService.appelOffres.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_AO_ID },
      });
      expect(
        mockPrismaService.demandeClarification.create,
      ).toHaveBeenCalledWith({
        data: {
          aoId: MOCK_AO_ID,
          operateurId: 'operateur-uuid',
          question: 'Ma question',
        },
      });
      expect(result).toEqual(mockClarification);
    });

    it("devrait lever NotFoundException si l'AO n'existe pas", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(null);

      await expect(
        service.create(MOCK_AO_ID, 'op-id', 'Ma question'),
      ).rejects.toThrow(NotFoundException);
    });

    it("devrait lever ConflictException si l'AO est au statut CLOTURE", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue({
        ...mockAo,
        statut: StatutAO.CLOTURE,
      });

      await expect(
        service.create(MOCK_AO_ID, 'op-id', 'Ma question'),
      ).rejects.toThrow(ConflictException);
    });

    it("devrait lever ConflictException si l'AO est au statut OUVERTURE_PLIS", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue({
        ...mockAo,
        statut: StatutAO.OUVERTURE_PLIS,
      });

      await expect(
        service.create(MOCK_AO_ID, 'op-id', 'Ma question'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllByAo()', () => {
    it('devrait retourner la liste de toutes les clarifications', async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.demandeClarification.findMany.mockResolvedValue([
        mockClarification,
      ]);

      const result = await service.findAllByAo(MOCK_AO_ID);

      expect(
        mockPrismaService.demandeClarification.findMany,
      ).toHaveBeenCalledWith({
        where: { aoId: MOCK_AO_ID },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockClarification]);
    });

    it("devrait lever NotFoundException si l'AO n'existe pas", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(null);

      await expect(service.findAllByAo(MOCK_AO_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('repondre()', () => {
    it('devrait répondre à la question, enregistrer en BDD et publier un événement', async () => {
      const updatedMock = {
        ...mockClarification,
        reponse: 'Ma reponse',
        reponduAt: new Date(),
      };

      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.demandeClarification.findUnique.mockResolvedValue(
        mockClarification,
      );
      mockPrismaService.demandeClarification.update.mockResolvedValue(
        updatedMock,
      );

      const result = await service.repondre(
        MOCK_AO_ID,
        MOCK_CLARIF_ID,
        'contractant-uuid',
        'Ma reponse',
      );

      expect(
        mockPrismaService.demandeClarification.update,
      ).toHaveBeenCalledWith({
        where: { id: MOCK_CLARIF_ID },
        data: {
          reponse: 'Ma reponse',
          reponduAt: expect.any(Date),
        },
      });
      expect(
        mockAoEventsPublisher.publishClarificationRepondue,
      ).toHaveBeenCalledWith({
        aoId: MOCK_AO_ID,
        clarificationId: MOCK_CLARIF_ID,
        question: mockClarification.question,
        reponse: 'Ma reponse',
        reponduAt: expect.any(Date),
      });
      expect(result).toEqual(updatedMock);
    });

    it("devrait lever NotFoundException si la clarification n'appartient pas au bon AO", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.demandeClarification.findUnique.mockResolvedValue({
        ...mockClarification,
        aoId: 'different-ao-uuid',
      });

      await expect(
        service.repondre(
          MOCK_AO_ID,
          MOCK_CLARIF_ID,
          'contractant-uuid',
          'Ma reponse',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
