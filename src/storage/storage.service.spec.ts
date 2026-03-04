import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mocking the external AWS SDK dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;
  let mockConfigService: Partial<ConfigService>;

  // Local mock for the internal s3Client.send method
  const sendMock = jest.fn();

  beforeEach(async () => {
    // Resetting mocks between tests
    jest.clearAllMocks();

    // Inject our mock send function into the mocked S3Client constructor
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: sendMock,
    }));

    mockConfigService = {
      get: jest.fn((key: string, defaultValue: string) => {
        if (key === 'MINIO_ENDPOINT') return 'http://localhost:9000';
        if (key === 'MINIO_ACCESS_KEY') return 'minioadmin';
        if (key === 'MINIO_SECRET_KEY') return 'minioadmin';
        return defaultValue;
      }) as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully upload a file and return the formatted S3 URI', async () => {
      // Setup
      const bucket = 'test-bucket';
      const key = 'test-file.pdf';
      const buffer = Buffer.from('test data');
      const mimetype = 'application/pdf';

      sendMock.mockResolvedValueOnce({} as any);

      // Execute
      const result = await service.uploadFile(bucket, key, buffer, mimetype);

      // Assert
      expect(result).toBe(`s3://${bucket}/${key}`);
      expect(sendMock).toHaveBeenCalledTimes(1);
      // We check that it instantiated a command with the right parameters
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      });
    });

    it('should throw an InternalServerErrorException if the upload fails', async () => {
      const loggerSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      sendMock.mockRejectedValueOnce(new Error('S3 Error'));

      await expect(
        service.uploadFile('bucket', 'key', Buffer.from(''), 'text/plain')
      ).rejects.toThrow('Erreur lors de l\'upload du fichier');

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should generate a valid presigned URL', async () => {
      const fakeUrl = 'http://localhost:9000/bucket/key?signed=true';
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(fakeUrl);

      const result = await service.getPresignedDownloadUrl('bucket', 'key');

      expect(result).toBe(fakeUrl);
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      // getSignedUrl uses the GetObjectCommand we initialized
    });

    it('should throw an InternalServerErrorException if URL generation fails', async () => {
      const loggerSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Sign Error'));

      await expect(
        service.getPresignedDownloadUrl('bucket', 'key')
      ).rejects.toThrow('Impossible de générer le lien');

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });
});
