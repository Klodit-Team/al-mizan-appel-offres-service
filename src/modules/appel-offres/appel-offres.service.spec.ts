/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { AppelOffresService } from './appel-offres.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { AoEventsPublisher } from '../../messaging/publishers/ao-events.publisher';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StatutAO } from '@prisma/client';

describe('AppelOffresService', () => {
  let service: AppelOffresService;
  let prisma: any;
  let storage: any;

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
    },
    retraitCdc: {
      create: jest.fn(),
    },
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
  };

  // Mock du publisher — toutes les méthodes sont des no-ops dans les tests unitaires
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
        { provide: StorageService, useValue: mockStorageService },
        { provide: AoEventsPublisher, useValue: mockAoEventsPublisher },
      ],
    }).compile();

    service = module.get<AppelOffresService>(AppelOffresService);
    prisma = module.get<PrismaService>(PrismaService);
    storage = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadCdc', () => {
    it("doit lever une ConflictException si l'AO n'est pas BROUILLON", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({
        statut: StatutAO.PUBLIE,
      });

      const fileBuffer = Buffer.from('test pdf');
      await expect(
        service.uploadCdc('ao-id', fileBuffer, 'application/pdf', 0),
      ).rejects.toThrow(ConflictException);
    });

    it('doit uploader sur S3 et créer un document dans Prisma', async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({
        statut: StatutAO.BROUILLON,
      });
      storage.uploadFile.mockResolvedValueOnce('s3://cdc-documents/AO-123.pdf');
      prisma.documentCdc.create.mockResolvedValueOnce({ id: 'doc-123' });

      const fileBuffer = Buffer.from('test pdf');
      const result = await service.uploadCdc(
        'ao-id',
        fileBuffer,
        'application/pdf',
        500,
      );

      expect(storage.uploadFile).toHaveBeenCalledTimes(1);
      expect(prisma.documentCdc.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aoId: 'ao-id',
          fichierUrl: 's3://cdc-documents/AO-123.pdf',
          prixRetrait: 500,
        }),
      });
      expect(result).toEqual({ id: 'doc-123' });
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

    it("doit générer une URL, tracer le retrait et retourner l'URL", async () => {
      prisma.appelOffres.findUnique.mockResolvedValueOnce({ id: 'ao-id' });
      prisma.documentCdc.findFirst.mockResolvedValueOnce({
        id: 'doc-id',
        fichierUrl: 's3://cdc-documents/my-file.pdf',
      });
      storage.getPresignedDownloadUrl.mockResolvedValueOnce(
        'https://minio.local/download?sign',
      );
      prisma.retraitCdc.create.mockResolvedValueOnce({ id: 'retrait-1' });

      const result = await service.getPresignedDownloadUrl('ao-id', 'op-id');

      expect(storage.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'cdc-documents',
        'my-file.pdf',
      );
      expect(prisma.retraitCdc.create).toHaveBeenCalledWith({
        data: {
          documentCdcId: 'doc-id',
          operateurId: 'op-id',
        },
      });
      expect(result).toEqual({
        downloadUrl: 'https://minio.local/download?sign',
      });
    });
  });
});
