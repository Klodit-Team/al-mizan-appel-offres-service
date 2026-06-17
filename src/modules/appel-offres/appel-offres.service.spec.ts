/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { AppelOffresService } from './appel-offres.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatutAO } from '@prisma/client';
import { of } from 'rxjs';

describe('AppelOffresService', () => {
  let service: AppelOffresService;
  let prisma: any;
  let http: any;

  const mockPrismaService = {
    appelOffres: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    documentCdc: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    retraitCdc: {
      create: jest.fn(),
    },
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: string) => {
      if (key === 'DOCUMENT_SERVICE_URL') return 'http://localhost:8005';
      return defaultVal;
    }),
  };

  const mockAoEventsPublisher = {
    publishAoCreated: jest.fn(),
    publishAoPublished: jest.fn(),
    publishAoStatusChanged: jest.fn(),
    publishAttributionProvisoire: jest.fn(),
    publishAttributionDefinitive: jest.fn(),
    publishAoAnnule: jest.fn(),
    publishGreAGreSubmitted: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppelOffresService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: AoEventsPublisher, useValue: mockAoEventsPublisher },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AppelOffresService>(AppelOffresService);
    prisma = module.get<PrismaService>(PrismaService);
    http = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadCdc', () => {
    it("doit lever une ConflictException si l'AO n'est pas BROUILLON", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({
        statut: StatutAO.PUBLIE,
      });

      await expect(service.uploadCdc('ao-id', 'doc-123', 0)).rejects.toThrow(
        ConflictException,
      );
    });

    it('doit lier le document dans Prisma', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({
        statut: StatutAO.BROUILLON,
      });
      prisma.documentCdc.create.mockResolvedValueOnce({ id: 'cdc-123' });

      const result = await service.uploadCdc('ao-id', 'doc-uuid', 500);

      expect(prisma.documentCdc.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aoId: 'ao-id',
          documentId: 'doc-uuid',
          prixRetrait: 500,
        }),
      });
      expect(result).toEqual({ id: 'cdc-123' });
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it("doit retourner une NotFoundException s'il n'y a pas de CDC", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.documentCdc.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.getPresignedDownloadUrl('ao-id', 'op-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it("doit récupérer l'URL depuis Document Service, tracer le retrait et retourner l'URL", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.documentCdc.findFirst.mockResolvedValueOnce({
        id: 'cdc-id',
        documentId: 'doc-id',
      });
      http.get.mockReturnValueOnce(
        of({ data: { url: 'https://minio.local/download?sign' } }),
      );
      prisma.retraitCdc.create.mockResolvedValueOnce({ id: 'retrait-1' });

      const result = await service.getPresignedDownloadUrl('ao-id', 'op-id');

      expect(http.get).toHaveBeenCalledWith(
        'http://localhost:8005/api/documents/doc-id/download',
      );
      expect(prisma.retraitCdc.create).toHaveBeenCalledWith({
        data: {
          documentCdcId: 'cdc-id',
          operateurId: 'op-id',
        },
      });
      expect(result).toEqual({
        downloadUrl: 'https://minio.local/download?sign',
        documentId: 'doc-id',
      });
    });
  });

  describe('update', () => {
    it('doit autoriser la modification si l AO est en BROUILLON', async () => {
      const mockAo = { id: 'ao-id', statut: StatutAO.BROUILLON };
      prisma.appelOffres.findUnique.mockResolvedValueOnce(mockAo);
      prisma.appelOffres.update.mockResolvedValueOnce({
        ...mockAo,
        objet: 'Nouveau',
      });

      const result = await service.update('ao-id', { objet: 'Nouveau' });

      expect(prisma.appelOffres.update).toHaveBeenCalledWith({
        where: { id: 'ao-id' },
        data: { objet: 'Nouveau' },
      });
      expect(result.objet).toBe('Nouveau');
    });

    it('doit lever une ConflictException si l AO n est plus en BROUILLON', async () => {
      const mockAo = { id: 'ao-id', statut: StatutAO.PUBLIE };
      prisma.appelOffres.findUnique.mockResolvedValueOnce(mockAo);

      await expect(
        service.update('ao-id', { objet: 'Nouveau' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.appelOffres.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('doit autoriser la suppression si l AO est en BROUILLON', async () => {
      const mockAo = { id: 'ao-id', statut: StatutAO.BROUILLON };
      prisma.appelOffres.findUnique.mockResolvedValueOnce(mockAo);
      prisma.appelOffres.delete.mockResolvedValueOnce(mockAo);

      await service.remove('ao-id');

      expect(prisma.appelOffres.delete).toHaveBeenCalledWith({
        where: { id: 'ao-id' },
      });
    });

    it('doit lever une ConflictException si l AO n est plus en BROUILLON', async () => {
      const mockAo = { id: 'ao-id', statut: StatutAO.PUBLIE };
      prisma.appelOffres.findUnique.mockResolvedValueOnce(mockAo);

      await expect(service.remove('ao-id')).rejects.toThrow(ConflictException);
      expect(prisma.appelOffres.delete).not.toHaveBeenCalled();
    });
  });

  describe('calculateProposedDates', () => {
    it('doit calculer les dates pour une procédure simple (GRE_A_GRE) + 21 jours', () => {
      // 2026-05-04 est un lundi. Lundi + 21 jours = 2026-05-25 (lundi)
      const datePub = '2026-05-04T08:00:00.000Z';
      const result = service.calculateProposedDates('GRE_A_GRE', datePub);

      expect(result.dateLimiteSoumission).toContain('2026-05-25');
      // Le pli d'ouverture tombe un lundi (jour de semaine), donc pas de décalage de weekend, mais calé à 13h00 local
      expect(new Date(result.dateOuverturePlis).getHours()).toBe(13);
      expect(result.dateOuverturePlis).toContain('2026-05-25');
    });

    it('doit calculer les dates pour capacités minimales (AO_RESTREINT) + 30 jours', () => {
      // 2026-05-04 (lundi) + 30 jours = 2026-06-03 (mercredi)
      const datePub = '2026-05-04T08:00:00.000Z';
      const result = service.calculateProposedDates('AO_RESTREINT', datePub);

      expect(result.dateLimiteSoumission).toContain('2026-06-03');
      expect(new Date(result.dateOuverturePlis).getHours()).toBe(13);
      expect(result.dateOuverturePlis).toContain('2026-06-03');
    });

    it('doit calculer les dates pour AO complexe (AO_OUVERT) + 45 jours et reporter le pli si c est le weekend', () => {
      // 2026-05-05 (mardi) + 45 jours = 2026-06-19 (vendredi !).
      const datePub = '2026-05-05T08:00:00.000Z';
      const result = service.calculateProposedDates('AO_OUVERT', datePub);

      // Limite : 19 juin 2026 (vendredi)
      expect(result.dateLimiteSoumission).toContain('2026-06-19');
      // Ouverture initiale : vendredi 19 juin. Doit être reportée au dimanche suivant (21 juin 2026) à 13h00 local !
      expect(new Date(result.dateOuverturePlis).getHours()).toBe(13);
      expect(result.dateOuverturePlis).toContain('2026-06-21');
    });

    it('doit reporter au dimanche si l ouverture initiale tombe un samedi', () => {
      // Si date publication = 2026-05-06 (mercredi) + 45 jours = 2026-06-20 (samedi !)
      const datePub = '2026-05-06T08:00:00.000Z';
      const result = service.calculateProposedDates('AO_OUVERT', datePub);

      // Limite : 20 juin 2026 (samedi)
      expect(result.dateLimiteSoumission).toContain('2026-06-20');
      // Ouverture initiale : samedi 20 juin. Doit être reportée au dimanche 21 juin 2026 à 13h00 local !
      expect(new Date(result.dateOuverturePlis).getHours()).toBe(13);
      expect(result.dateOuverturePlis).toContain('2026-06-21');
    });
  });

  describe('getCdcWithMetadata', () => {
    it('doit lever NotFoundException si l AO n existe pas', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce(null);

      await expect(service.getCdcWithMetadata('invalid-ao')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('doit retourner le CDC avec les metadonnees enrichies du document-service', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({
        id: 'ao-id',
        reference: 'AO-2026-01',
        statut: StatutAO.PUBLIE,
        dateLimiteRetraitCdc: new Date(),
      });

      prisma.documentCdc.findMany.mockResolvedValueOnce([
        {
          id: 'cdc-uuid',
          documentId: 'doc-uuid',
          prixRetrait: 500,
          publieAt: new Date(),
          retraitsCdc: [
            { id: 'ret-1', operateurId: 'op-1', dateRetrait: new Date() },
          ],
        },
      ]);

      const mockMetadata = {
        id: 'doc-uuid',
        nom: 'cdc.pdf',
        typeMime: 'application/pdf',
        tailleOctets: 1024,
      };

      http.get.mockReturnValueOnce(of({ data: mockMetadata }));

      const result = await service.getCdcWithMetadata('ao-id');

      expect(prisma.appelOffres.findUnique).toHaveBeenCalledWith({
        where: { id: 'ao-id' },
        select: expect.any(Object),
      });
      expect(prisma.documentCdc.findMany).toHaveBeenCalledWith({
        where: { aoId: 'ao-id' },
        include: expect.any(Object),
        orderBy: { publieAt: 'desc' },
      });
      expect(http.get).toHaveBeenCalledWith(
        'http://localhost:8005/api/documents/doc-uuid',
      );
      expect(result.aoId).toBe('ao-id');
      expect(result.documents[0].metadata).toEqual(mockMetadata);
    });
  });
});
