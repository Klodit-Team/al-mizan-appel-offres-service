import { Test, TestingModule } from '@nestjs/testing';
import { MarcheService } from './marche.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMarcheDto } from './dto/create-marche.dto';

const MOCK_AO_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_ATTR_ID = '00000000-0000-0000-0000-000000000002';
const MOCK_MARCHE_ID = '00000000-0000-0000-0000-000000000003';

const mockAo = { id: MOCK_AO_ID };
const mockAttribution = { id: MOCK_ATTR_ID, aoId: MOCK_AO_ID };
const mockMarche = {
  id: MOCK_MARCHE_ID,
  aoId: MOCK_AO_ID,
  attributionId: MOCK_ATTR_ID,
  referenceMarche: 'REF-2026-001',
  montantSigne: 1000000,
  dateSignature: new Date(),
  delaiExecution: 180,
};

const mockPrismaService = {
  appelOffres: { findUnique: jest.fn() },
  attribution: { findUnique: jest.fn() },
  marche: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('MarcheService', () => {
  let service: MarcheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcheService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MarcheService>(MarcheService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create() ─────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto: CreateMarcheDto = {
      aoId: MOCK_AO_ID,
      attributionId: MOCK_ATTR_ID,
      referenceMarche: 'REF-2026-001',
      montantSigne: 1000000,
      dateSignature: new Date().toISOString(),
      delaiExecution: 180,
    };

    it("devrait créer un marché quand l'AO et l'Attribution existent", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.attribution.findUnique.mockResolvedValue(
        mockAttribution,
      );
      // checkUniqueness: pas de doublon
      mockPrismaService.marche.findUnique.mockResolvedValue(null);
      mockPrismaService.marche.create.mockResolvedValue(mockMarche);

      const result = await service.create(dto);
      expect(result).toEqual(mockMarche);
    });

    it("devrait lever NotFoundException si l'AO n'existe pas", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it("devrait lever NotFoundException si l'Attribution n'existe pas", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.attribution.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it("devrait lever BadRequestException si l'Attribution n'appartient pas à l'AO", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.attribution.findUnique.mockResolvedValue({
        ...mockAttribution,
        aoId: 'autre-ao-id',
      });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('devrait lever ConflictException si la référence du marché est déjà utilisée', async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.attribution.findUnique.mockResolvedValue(
        mockAttribution,
      );
      // findUnique appelé pour referenceMarche: doublon
      mockPrismaService.marche.findUnique
        .mockResolvedValueOnce(null) // attributionId: pas de doublon
        .mockResolvedValueOnce(mockMarche); // referenceMarche: DOUBLON !
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it("devrait lever ConflictException si l'Attribution est déjà liée à un autre marché", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.attribution.findUnique.mockResolvedValue(
        mockAttribution,
      );
      // Le premier findUnique pour attributionId retourne directement un doublon
      mockPrismaService.marche.findUnique.mockResolvedValueOnce(mockMarche); // attributionId: DOUBLON !
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── findAll() ────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('devrait retourner toutes les fiches marchés', async () => {
      mockPrismaService.marche.findMany.mockResolvedValue([mockMarche]);
      const result = await service.findAll();
      expect(result).toEqual([mockMarche]);
    });
  });

  // ─── findOne() ────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('devrait retourner un marché existant', async () => {
      // findMarcheOrFail (1er appel) puis findUnique avec include (2ème appel)
      mockPrismaService.marche.findUnique
        .mockResolvedValueOnce(mockMarche)
        .mockResolvedValueOnce(mockMarche);
      const result = await service.findOne(MOCK_MARCHE_ID);
      expect(result).toBeDefined();
    });

    it('devrait lever NotFoundException si non trouvé', async () => {
      mockPrismaService.marche.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update() ────────────────────────────────────────────────────────────
  describe('update()', () => {
    it("devrait lever NotFoundException si le marché n'existe pas", async () => {
      mockPrismaService.marche.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait mettre à jour un marché existant', async () => {
      const updated = { ...mockMarche, delaiExecution: 360 };
      mockPrismaService.marche.findUnique.mockResolvedValue(mockMarche); // findMarcheOrFail
      // checkUniqueness: pas de doublon
      mockPrismaService.marche.update.mockResolvedValue(updated);

      const result = await service.update(MOCK_MARCHE_ID, {
        delaiExecution: 360,
      });
      expect(result.delaiExecution).toEqual(360);
    });
  });

  // ─── remove() ────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('devrait supprimer un marché existant', async () => {
      mockPrismaService.marche.findUnique.mockResolvedValue(mockMarche);
      mockPrismaService.marche.delete.mockResolvedValue(mockMarche);

      const result = await service.remove(MOCK_MARCHE_ID);
      expect(mockPrismaService.marche.delete).toHaveBeenCalledWith({
        where: { id: MOCK_MARCHE_ID },
      });
      expect(result).toEqual(mockMarche);
    });

    it("devrait lever NotFoundException si le marché n'existe pas", async () => {
      mockPrismaService.marche.findUnique.mockResolvedValue(null);
      await expect(service.remove('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
