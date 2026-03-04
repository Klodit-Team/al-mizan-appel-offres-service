import { Test, TestingModule } from '@nestjs/testing';
import { MarcheService } from './marche.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateMarcheDto } from './dto/create-marche.dto';

describe('MarcheService', () => {
  let service: MarcheService;
  const mockMarche = {
    id: 'test-id',
    aoId: 'ao-id',
    attributionId: 'attribution-id',
    referenceMarche: 'REF-2026',
    montantSigne: 1000000,
    dateSignature: new Date(),
    delaiExecution: 180,
  };

  const mockPrismaService = {
    marche: {
      create: jest.fn().mockResolvedValue(mockMarche),
      findMany: jest.fn().mockResolvedValue([mockMarche]),
      findUnique: jest.fn().mockResolvedValue(mockMarche),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockMarche, delaiExecution: 360 }),
      delete: jest.fn().mockResolvedValue(mockMarche),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcheService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MarcheService>(MarcheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer une fiche marché', async () => {
      const dto: CreateMarcheDto = {
        aoId: 'ao-id',
        attributionId: 'attribution-id',
        referenceMarche: 'REF-2026',
        montantSigne: 1000000,
        dateSignature: new Date().toISOString(),
        delaiExecution: 180,
      };

      const result = await service.create(dto);
      expect(mockPrismaService.marche.create).toHaveBeenCalledWith({
        data: dto,
        include: { appelOffres: true, attribution: true },
      });
      expect(result).toEqual(mockMarche);
    });
  });

  describe('findAll', () => {
    it('devrait retourner toutes les fiches marchés', async () => {
      const result = await service.findAll();
      expect(mockPrismaService.marche.findMany).toHaveBeenCalledWith({
        include: { appelOffres: true },
      });
      expect(result).toEqual([mockMarche]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner une fiche marché', async () => {
      const result = await service.findOne('test-id');
      expect(mockPrismaService.marche.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: { attribution: true },
      });
      expect(result).toEqual(mockMarche);
    });

    it('devrait lancer NotFoundException si non trouvé', async () => {
      mockPrismaService.marche.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une fiche marché', async () => {
      const result = await service.update('test-id', { delaiExecution: 360 });
      expect(mockPrismaService.marche.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { delaiExecution: 360 },
      });
      expect(result.delaiExecution).toEqual(360);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une fiche marché', async () => {
      const result = await service.remove('test-id');
      expect(mockPrismaService.marche.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockMarche);
    });
  });
});
