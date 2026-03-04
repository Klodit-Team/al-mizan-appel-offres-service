/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEvaluationService } from './criteres-evaluation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StatutAO, CategorieCritereEvaluation } from '@prisma/client';

describe('CriteresEvaluationService', () => {
  let service: CriteresEvaluationService;
  let prisma: any;

  const mockPrismaService = {
    appelOffres: {
      findUnique: jest.fn(),
    },
    critereEvaluation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CriteresEvaluationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CriteresEvaluationService>(CriteresEvaluationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it("doit lever NotFoundException si l'AO n'existe pas", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create('ao-id', {
          libelle: 'test',
          categorie: CategorieCritereEvaluation.TECHNIQUE,
          poids: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("doit lever ConflictException si l'AO n'est pas BROUILLON", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({
        statut: StatutAO.PUBLIE,
      });

      await expect(
        service.create('ao-id', {
          libelle: 'test',
          categorie: CategorieCritereEvaluation.TECHNIQUE,
          poids: 10,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("doit créer le critère si l'AO est BROUILLON", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({
        statut: StatutAO.BROUILLON,
      });
      prisma.critereEvaluation.create.mockResolvedValueOnce({ id: 'crit-1' });

      const result = await service.create('ao-id', {
        libelle: 'test',
        categorie: CategorieCritereEvaluation.TECHNIQUE,
        poids: 10,
      });

      expect(prisma.critereEvaluation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aoId: 'ao-id',
          libelle: 'test',
          poids: 10,
        }),
      });
      expect(result).toEqual({ id: 'crit-1' });
    });
  });

  describe('findAll', () => {
    it("doit retourner les critères de l'AO", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.critereEvaluation.findMany.mockResolvedValueOnce([
        { id: 'crit-1' },
      ]);

      const result = await service.findAll('ao-id');
      expect(prisma.critereEvaluation.findMany).toHaveBeenCalledWith({
        where: { aoId: 'ao-id' },
      });
      expect(result).toEqual([{ id: 'crit-1' }]);
    });
  });

  describe('findOne', () => {
    it("doit lever NotFoundException si le critère n'est pas trouvé dans cet AO", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.critereEvaluation.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('ao-id', 'crit-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('doit retourner le critère demandé', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.critereEvaluation.findUnique.mockResolvedValueOnce({
        id: 'crit-id',
      });

      const result = await service.findOne('ao-id', 'crit-id');
      expect(result).toEqual({ id: 'crit-id' });
    });
  });

  describe('update', () => {
    it("doit lever ConflictException si le critère n'appartient pas à l'AO", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.critereEvaluation.findUnique.mockResolvedValueOnce({
        id: 'crit-id',
        aoId: 'other-ao',
      });

      await expect(
        service.update('ao-id', 'crit-id', { libelle: 'new' }),
      ).rejects.toThrow(ConflictException);
    });

    it('doit mettre à jour le critère', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.critereEvaluation.findUnique.mockResolvedValueOnce({
        id: 'crit-id',
        aoId: 'ao-id',
      });
      prisma.critereEvaluation.update.mockResolvedValueOnce({
        id: 'crit-id',
        libelle: 'new',
      });

      const result = await service.update('ao-id', 'crit-id', {
        libelle: 'new',
      });

      expect(prisma.critereEvaluation.update).toHaveBeenCalledWith({
        where: { id: 'crit-id' },
        data: { libelle: 'new' },
      });
      expect(result).toEqual({ id: 'crit-id', libelle: 'new' });
    });
  });

  describe('remove', () => {
    it("doit lever Error si le critère n'appartient pas à l'AO", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.critereEvaluation.findUnique.mockResolvedValueOnce({
        id: 'crit-id',
        aoId: 'other-ao',
      });

      await expect(service.remove('ao-id', 'crit-id')).rejects.toThrow(
        "Le critère n'est pas lié à cet Appel d'Offres",
      );
    });

    it('doit supprimer le critère', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.critereEvaluation.findUnique.mockResolvedValueOnce({
        id: 'crit-id',
        aoId: 'ao-id',
      });
      prisma.critereEvaluation.delete.mockResolvedValueOnce({ id: 'crit-id' });

      const result = await service.remove('ao-id', 'crit-id');

      expect(prisma.critereEvaluation.delete).toHaveBeenCalledWith({
        where: { id: 'crit-id' },
      });
      expect(result).toEqual({ id: 'crit-id' });
    });
  });
});
