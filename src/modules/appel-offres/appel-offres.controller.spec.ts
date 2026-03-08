import { Test, TestingModule } from '@nestjs/testing';
import { AppelOffresController } from './appel-offres.controller';
import { AppelOffresService } from './appel-offres.service';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

const MOCK_OPERATEUR_ID = 'operateur-jwt-sub-uuid';

const mockReq = {
  user: { sub: MOCK_OPERATEUR_ID },
} as Request & { user: { sub: string } };

describe('AppelOffresController', () => {
  let controller: AppelOffresController;

  const mockAppelOffresService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatut: jest.fn(),
    uploadCdc: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppelOffresController],
      providers: [
        {
          provide: AppelOffresService,
          useValue: mockAppelOffresService,
        },
      ],
    }).compile();

    controller = module.get<AppelOffresController>(AppelOffresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadCdc', () => {
    it('doit lever une erreur si le fichier est manquant', async () => {
      await expect(
        controller.uploadCdc(
          'ao-id',
          { prixRetrait: 0, fichier: null },
          null as unknown as Express.Multer.File,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('doit appeler le service uploadCdc avec les bons paramètres', async () => {
      const mockFile = {
        buffer: Buffer.from('test pdf'),
        mimetype: 'application/pdf',
      } as unknown as Express.Multer.File;

      mockAppelOffresService.uploadCdc.mockResolvedValueOnce({ id: 'doc-123' });

      const result = await controller.uploadCdc(
        'ao-id',
        { prixRetrait: 250, fichier: mockFile },
        mockFile,
      );

      expect(mockAppelOffresService.uploadCdc).toHaveBeenCalledWith(
        'ao-id',
        mockFile.buffer,
        mockFile.mimetype,
        250,
      );
      expect(result).toEqual({ id: 'doc-123' });
    });
  });

  describe('getCdcDownloadUrl', () => {
    it("doit appeler le service avec l'operateurId extrait du JWT", async () => {
      mockAppelOffresService.getPresignedDownloadUrl.mockResolvedValueOnce({
        downloadUrl: 'http://test',
      });

      const result = await controller.getCdcDownloadUrl('ao-id', mockReq);

      expect(
        mockAppelOffresService.getPresignedDownloadUrl,
      ).toHaveBeenCalledWith('ao-id', MOCK_OPERATEUR_ID);
      expect(result).toEqual({ downloadUrl: 'http://test' });
    });

    it("doit utiliser 'anonymous' si req.user est absent", async () => {
      const reqSansUser = {} as Request & { user?: { sub: string } };
      mockAppelOffresService.getPresignedDownloadUrl.mockResolvedValueOnce({
        downloadUrl: 'http://test',
      });

      await controller.getCdcDownloadUrl('ao-id', reqSansUser);

      expect(
        mockAppelOffresService.getPresignedDownloadUrl,
      ).toHaveBeenCalledWith('ao-id', 'anonymous');
    });
  });
});
