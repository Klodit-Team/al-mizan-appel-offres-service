import { Test, TestingModule } from '@nestjs/testing';
import { AvisAoService } from './avis-ao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { TypeAvis } from '@prisma/client';
import { CreateAvisAoDto } from './dto/create-avis-ao.dto';

describe('AvisAoService', () => {
  let service: AvisAoService;
  const mockAvis = {
    id: 'test-id',
    aoId: 'ao-id',
    typeAvis: TypeAvis.PUBLICATION,
    contenuBomop: 'Contenu test',
    datePublication: new Date(),
    publieBomop: true,
    publiePresse: false,
  };

  const mockPrismaService = {
    avisAo: {
      create: jest.fn().mockResolvedValue(mockAvis),
      findMany: jest.fn().mockResolvedValue([mockAvis]),
      findUnique: jest.fn().mockResolvedValue(mockAvis),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockAvis, contenuBomop: 'Updated' }),
      delete: jest.fn().mockResolvedValue(mockAvis),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvisAoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AvisAoService>(AvisAoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer un avis', async () => {
      const dto: CreateAvisAoDto = {
        aoId: 'ao-id',
        typeAvis: TypeAvis.PUBLICATION,
        contenuBomop: 'Contenu test',
        datePublication: new Date().toISOString(),
      };

      const result = await service.create(dto);
      expect(mockPrismaService.avisAo.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(mockAvis);
    });
  });

  describe('findAll', () => {
    it('devrait retourner tous les avis', async () => {
      const result = await service.findAll();
      expect(mockPrismaService.avisAo.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockAvis]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un avis', async () => {
      const result = await service.findOne('test-id');
      expect(mockPrismaService.avisAo.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockAvis);
    });

    it('devrait lancer NotFoundException si non trouvé', async () => {
      mockPrismaService.avisAo.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un avis', async () => {
      const result = await service.update('test-id', {
        contenuBomop: 'Updated',
      });
      expect(mockPrismaService.avisAo.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { contenuBomop: 'Updated' },
      });
      expect(result.contenuBomop).toEqual('Updated');
    });
  });

  describe('remove', () => {
    it('devrait supprimer un avis', async () => {
      const result = await service.remove('test-id');
      expect(mockPrismaService.avisAo.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockAvis);
    });
  });
});
