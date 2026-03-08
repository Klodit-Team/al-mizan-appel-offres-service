import { Test, TestingModule } from '@nestjs/testing';
import { AttributionService } from './attribution.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TypeAttribution } from '@prisma/client';
import { CreateAttributionDto } from './dto/create-attribution.dto';

const MOCK_AO_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_ATTR_ID = '00000000-0000-0000-0000-000000000002';
const MOCK_LOT_ID = '00000000-0000-0000-0000-000000000003';

const mockAo = { id: MOCK_AO_ID };
const mockLot = { id: MOCK_LOT_ID, aoId: MOCK_AO_ID };
const mockAttribution = {
  id: MOCK_ATTR_ID,
  aoId: MOCK_AO_ID,
  soumissionId: 'soumission-id',
  type: TypeAttribution.PROVISOIRE,
  dateAttribution: new Date(),
  dateFinRecours: new Date(),
  montantAttribue: 1000000,
};

const mockPrismaService = {
  appelOffres: { findUnique: jest.fn() },
  lot: { findUnique: jest.fn() },
  attribution: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AttributionService', () => {
  let service: AttributionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AttributionService>(AttributionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create() ─────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto: CreateAttributionDto = {
      aoId: MOCK_AO_ID,
      soumissionId: 'soumission-id',
      type: TypeAttribution.PROVISOIRE,
      dateAttribution: new Date().toISOString(),
      dateFinRecours: new Date().toISOString(),
      montantAttribue: 1000000,
    };

    it("devrait créer une attribution quand l'AO existe", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.attribution.create.mockResolvedValue(mockAttribution);

      const result = await service.create(dto);
      expect(mockPrismaService.appelOffres.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_AO_ID },
      });
      expect(result).toEqual(mockAttribution);
    });

    it("devrait vérifier que le lot appartient à l'AO si lotId est fourni", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.lot.findUnique.mockResolvedValue(mockLot);
      mockPrismaService.attribution.create.mockResolvedValue(mockAttribution);

      await service.create({ ...dto, lotId: MOCK_LOT_ID });
      expect(mockPrismaService.lot.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_LOT_ID },
      });
    });

    it("devrait lever BadRequestException si le lot n'appartient pas à l'AO", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.lot.findUnique.mockResolvedValue({
        ...mockLot,
        aoId: 'autre-ao',
      });

      await expect(
        service.create({ ...dto, lotId: MOCK_LOT_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait lever NotFoundException si l'AO n'existe pas", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll() ────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('devrait retourner toutes les attributions', async () => {
      mockPrismaService.attribution.findMany.mockResolvedValue([
        mockAttribution,
      ]);
      const result = await service.findAll();
      expect(result).toEqual([mockAttribution]);
    });
  });

  // ─── findOne() ────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('devrait retourner une attribution existante avec ses relations', async () => {
      // findAttributionOrFail + findUnique avec include : tous les deux retournent mockAttribution
      mockPrismaService.attribution.findUnique.mockResolvedValue(
        mockAttribution,
      );
      const result = await service.findOne(MOCK_ATTR_ID);

      // Vérifie que la requête finale inclut les relations
      expect(mockPrismaService.attribution.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_ATTR_ID },
        include: { appelOffres: true, lot: true },
      });
      expect(result).toEqual(mockAttribution);
    });

    it('devrait lever NotFoundException si non trouvée', async () => {
      mockPrismaService.attribution.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update() ────────────────────────────────────────────────────────────
  describe('update()', () => {
    it("devrait lever NotFoundException si l'attribution n'existe pas", async () => {
      mockPrismaService.attribution.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait mettre à jour une attribution existante', async () => {
      const updated = { ...mockAttribution, montantAttribue: 2000000 };
      mockPrismaService.attribution.findUnique.mockResolvedValue(
        mockAttribution,
      );
      mockPrismaService.attribution.update.mockResolvedValue(updated);

      const result = await service.update(MOCK_ATTR_ID, {
        montantAttribue: 2000000,
      });
      expect(result.montantAttribue).toEqual(2000000);
    });
  });

  // ─── remove() ────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('devrait supprimer une attribution existante', async () => {
      mockPrismaService.attribution.findUnique.mockResolvedValue(
        mockAttribution,
      );
      mockPrismaService.attribution.delete.mockResolvedValue(mockAttribution);

      const result = await service.remove(MOCK_ATTR_ID);
      expect(mockPrismaService.attribution.delete).toHaveBeenCalledWith({
        where: { id: MOCK_ATTR_ID },
      });
      expect(result).toEqual(mockAttribution);
    });

    it("devrait lever NotFoundException si l'attribution n'existe pas", async () => {
      mockPrismaService.attribution.findUnique.mockResolvedValue(null);
      await expect(service.remove('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
