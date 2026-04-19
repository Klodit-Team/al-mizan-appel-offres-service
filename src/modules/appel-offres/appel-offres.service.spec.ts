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
      if (key === 'DOCUMENT_SERVICE_URL')
        return 'http://localhost:8005';
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
});
