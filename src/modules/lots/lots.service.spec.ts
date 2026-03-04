import { Test, TestingModule } from '@nestjs/testing';
import { LotsService } from './lots.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StatutAO } from '@prisma/client';

describe('LotsService', () => {
  let service: LotsService;
  let prisma: any;

  const mockPrismaService = {
    appelOffres: {
      findUnique: jest.fn(),
    },
    lot: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LotsService>(LotsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('doit lever NotFoundException si l\'AO n\'existe pas', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create('ao-id', { numero: '1', designation: 'Lot 1', montantEstime: 100 })
      ).rejects.toThrow(NotFoundException);
    });

    it('doit lever ConflictException si l\'AO n\'est pas BROUILLON', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ statut: StatutAO.PUBLIE });

      await expect(
        service.create('ao-id', { numero: '1', designation: 'Lot 1', montantEstime: 100 })
      ).rejects.toThrow(ConflictException);
    });

    it('doit créer le lot si l\'AO est BROUILLON', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ statut: StatutAO.BROUILLON });
      prisma.lot.create.mockResolvedValueOnce({ id: 'lot-1' });

      const result = await service.create('ao-id', { numero: '1', designation: 'Lot 1', montantEstime: 100 });

      expect(prisma.lot.create).toHaveBeenCalledWith({
        data: {
          aoId: 'ao-id',
          numero: '1',
          designation: 'Lot 1',
          montantEstime: 100,
        },
      });
      expect(result).toEqual({ id: 'lot-1' });
    });
  });

  describe('findAll', () => {
    it('doit lever NotFoundException si l\'AO n\'existe pas', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce(null);

      await expect(service.findAll('ao-id')).rejects.toThrow(NotFoundException);
    });

    it('doit retourner la liste des lots triée par numéro', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.lot.findMany.mockResolvedValueOnce([{ id: 'lot-1' }]);

      const result = await service.findAll('ao-id');

      expect(prisma.lot.findMany).toHaveBeenCalledWith({
        where: { aoId: 'ao-id' },
        orderBy: { numero: 'asc' },
      });
      expect(result).toEqual([{ id: 'lot-1' }]);
    });
  });
});
