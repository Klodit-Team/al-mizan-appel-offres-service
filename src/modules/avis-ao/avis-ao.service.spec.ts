import { Test, TestingModule } from '@nestjs/testing';
import { AvisAoService } from './avis-ao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TypeAvis, TypeProcedure, StatutAO } from '@prisma/client';
import { CreateAvisAoDto } from './dto/create-avis-ao.dto';

const MOCK_AO_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_AVIS_ID = '00000000-0000-0000-0000-000000000002';

const mockAo = {
  id: MOCK_AO_ID,
  typeProcedure: TypeProcedure.AO_OUVERT,
  statut: StatutAO.PUBLIE,
};

const mockAvis = {
  id: MOCK_AVIS_ID,
  aoId: MOCK_AO_ID,
  typeAvis: TypeAvis.PUBLICATION,
  contenuBomop: 'Contenu test',
  datePublication: new Date(),
  publieBomop: true,
  publiePresse: false,
};

const mockPrismaService = {
  appelOffres: {
    findUnique: jest.fn(),
  },
  avisAo: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AvisAoService', () => {
  let service: AvisAoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvisAoService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AvisAoService>(AvisAoService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create() ─────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto: CreateAvisAoDto = {
      aoId: MOCK_AO_ID,
      typeAvis: TypeAvis.PUBLICATION,
      contenuBomop: 'Contenu test',
      datePublication: new Date().toISOString(),
    };

    it("devrait créer un avis si l'AO existe et est de type AO_OUVERT", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(mockAo);
      mockPrismaService.avisAo.create.mockResolvedValue(mockAvis);

      const result = await service.create(dto);

      expect(mockPrismaService.appelOffres.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_AO_ID },
      });
      expect(mockPrismaService.avisAo.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(mockAvis);
    });

    it("devrait lever NotFoundException si l'AO n'existe pas", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it("devrait lever BadRequestException si l'AO n'est pas de type AO_OUVERT", async () => {
      mockPrismaService.appelOffres.findUnique.mockResolvedValue({
        ...mockAo,
        typeProcedure: TypeProcedure.GRE_A_GRE,
      });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll() ────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('devrait retourner tous les avis', async () => {
      mockPrismaService.avisAo.findMany.mockResolvedValue([mockAvis]);
      const result = await service.findAll();
      expect(mockPrismaService.avisAo.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockAvis]);
    });
  });

  // ─── findOne() ────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('devrait retourner un avis existant', async () => {
      mockPrismaService.avisAo.findUnique.mockResolvedValue(mockAvis);
      const result = await service.findOne(MOCK_AVIS_ID);
      expect(mockPrismaService.avisAo.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_AVIS_ID },
      });
      expect(result).toEqual(mockAvis);
    });

    it("devrait lever NotFoundException si l'avis n'existe pas", async () => {
      mockPrismaService.avisAo.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update() ────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('devrait mettre à jour un avis existant', async () => {
      const updated = { ...mockAvis, contenuBomop: 'Updated' };
      mockPrismaService.avisAo.findUnique.mockResolvedValue(mockAvis); // findAvisAoOrFail
      mockPrismaService.avisAo.update.mockResolvedValue(updated);

      const result = await service.update(MOCK_AVIS_ID, {
        contenuBomop: 'Updated',
      });
      expect(mockPrismaService.avisAo.update).toHaveBeenCalledWith({
        where: { id: MOCK_AVIS_ID },
        data: { contenuBomop: 'Updated' },
      });
      expect(result.contenuBomop).toEqual('Updated');
    });

    it("devrait lever NotFoundException si l'avis n'existe pas lors de la mise à jour", async () => {
      mockPrismaService.avisAo.findUnique.mockResolvedValue(null);
      await expect(service.update('invalid', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it("devrait lever NotFoundException si le nouvel aoId n'existe pas", async () => {
      // findAvisAoOrFail OK, mais findAoOrFail échoue
      mockPrismaService.avisAo.findUnique.mockResolvedValue(mockAvis);
      mockPrismaService.appelOffres.findUnique.mockResolvedValue(null);

      await expect(
        service.update(MOCK_AVIS_ID, { aoId: 'autre-ao-inexistant' }),
      ).rejects.toThrow(NotFoundException);
    });

    it("devrait lever BadRequestException si le nouvel AO n'est pas de type AO_OUVERT", async () => {
      // findAvisAoOrFail OK, findAoOrFail OK mais type incompatible
      mockPrismaService.avisAo.findUnique.mockResolvedValue(mockAvis);
      mockPrismaService.appelOffres.findUnique.mockResolvedValue({
        ...mockAo,
        id: 'autre-ao-id',
        typeProcedure: TypeProcedure.GRE_A_GRE, // pas AO_OUVERT
      });

      await expect(
        service.update(MOCK_AVIS_ID, { aoId: 'autre-ao-id' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── remove() ────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('devrait supprimer un avis existant', async () => {
      mockPrismaService.avisAo.findUnique.mockResolvedValue(mockAvis);
      mockPrismaService.avisAo.delete.mockResolvedValue(mockAvis);

      const result = await service.remove(MOCK_AVIS_ID);
      expect(mockPrismaService.avisAo.delete).toHaveBeenCalledWith({
        where: { id: MOCK_AVIS_ID },
      });
      expect(result).toEqual(mockAvis);
    });

    it("devrait lever NotFoundException si l'avis n'existe pas lors de la suppression", async () => {
      mockPrismaService.avisAo.findUnique.mockResolvedValue(null);
      await expect(service.remove('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
