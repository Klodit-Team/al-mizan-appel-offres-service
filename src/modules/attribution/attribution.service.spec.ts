import { Test, TestingModule } from '@nestjs/testing';
import { AttributionService } from './attribution.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { TypeAttribution } from '@prisma/client';
import { CreateAttributionDto } from './dto/create-attribution.dto';

describe('AttributionService', () => {
  let service: AttributionService;
  const mockAttribution = {
    id: 'test-id',
    aoId: 'ao-id',
    soumissionId: 'soumission-id',
    type: TypeAttribution.PROVISOIRE,
    dateAttribution: new Date(),
    dateFinRecours: new Date(),
    montantAttribue: 1000000,
  };

  const mockPrismaService = {
    attribution: {
      create: jest.fn().mockResolvedValue(mockAttribution),
      findMany: jest.fn().mockResolvedValue([mockAttribution]),
      findUnique: jest.fn().mockResolvedValue(mockAttribution),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockAttribution, montantAttribue: 2000000 }),
      delete: jest.fn().mockResolvedValue(mockAttribution),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttributionService>(AttributionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer une attribution', async () => {
      const dto: CreateAttributionDto = {
        aoId: 'ao-id',
        soumissionId: 'soumission-id',
        type: TypeAttribution.PROVISOIRE,
        dateAttribution: new Date().toISOString(),
        dateFinRecours: new Date().toISOString(),
        montantAttribue: 1000000,
      };

      const result = await service.create(dto);
      expect(mockPrismaService.attribution.create).toHaveBeenCalledWith({
        data: dto,
        include: { appelOffres: true, lot: true },
      });
      expect(result).toEqual(mockAttribution);
    });
  });

  describe('findAll', () => {
    it('devrait retourner toutes les attributions', async () => {
      const result = await service.findAll();
      expect(mockPrismaService.attribution.findMany).toHaveBeenCalledWith({
        include: { appelOffres: true },
      });
      expect(result).toEqual([mockAttribution]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner une attribution', async () => {
      const result = await service.findOne('test-id');
      expect(mockPrismaService.attribution.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockAttribution);
    });

    it('devrait lancer NotFoundException si non trouvé', async () => {
      mockPrismaService.attribution.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une attribution', async () => {
      const result = await service.update('test-id', {
        montantAttribue: 2000000,
      });
      expect(mockPrismaService.attribution.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { montantAttribue: 2000000 },
      });
      expect(result.montantAttribue).toEqual(2000000);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une attribution', async () => {
      const result = await service.remove('test-id');
      expect(mockPrismaService.attribution.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockAttribution);
    });
  });
});
