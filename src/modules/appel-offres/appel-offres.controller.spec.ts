import { Test, TestingModule } from '@nestjs/testing';
import { AppelOffresController } from './appel-offres.controller';
import { AppelOffresService } from './appel-offres.service';
import { BadRequestException } from '@nestjs/common';

describe('AppelOffresController', () => {
  let controller: AppelOffresController;
  let service: jest.Mocked<AppelOffresService>;

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
    service = module.get<AppelOffresService>(AppelOffresService);
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

      expect(service.uploadCdc).toHaveBeenCalledWith(
        'ao-id',
        mockFile.buffer,
        mockFile.mimetype,
        250,
      );
      expect(result).toEqual({ id: 'doc-123' });
    });
  });

  describe('getCdcDownloadUrl', () => {
    it("doit appeler le service avec un mock operateurId pour l'instant", async () => {
      mockAppelOffresService.getPresignedDownloadUrl.mockResolvedValueOnce({
        downloadUrl: 'http://test',
      });

      const result = await controller.getCdcDownloadUrl('ao-id');

      expect(service.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'ao-id',
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toEqual({ downloadUrl: 'http://test' });
    });
  });
});
