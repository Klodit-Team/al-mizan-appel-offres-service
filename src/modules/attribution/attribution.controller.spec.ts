import { Test, TestingModule } from '@nestjs/testing';
import { AttributionController } from './attribution.controller';
import { AttributionService } from './attribution.service';
import { CreateAttributionDto } from './dto/create-attribution.dto';
import { UpdateAttributionDto } from './dto/update-attribution.dto';
import { TypeAttribution } from '@prisma/client';

describe('AttributionController', () => {
  let controller: AttributionController;
  let service: AttributionService;

  const mockAttribution = {
    id: 'test-id',
    aoId: 'ao-id',
    soumissionId: 'soumission-id',
    type: TypeAttribution.PROVISOIRE,
    dateAttribution: new Date(),
    dateFinRecours: new Date(),
    montantAttribue: 1000000,
  };

  const mockAttributionService = {
    create: jest.fn().mockResolvedValue(mockAttribution),
    findAll: jest.fn().mockResolvedValue([mockAttribution]),
    findOne: jest.fn().mockResolvedValue(mockAttribution),
    update: jest.fn().mockResolvedValue({ ...mockAttribution, montantAttribue: 2000000 }),
    remove: jest.fn().mockResolvedValue(mockAttribution),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributionController],
      providers: [
        {
          provide: AttributionService,
          useValue: mockAttributionService,
        },
      ],
    }).compile();

    controller = module.get<AttributionController>(AttributionController);
    service = module.get<AttributionService>(AttributionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer une attribution', async () => {
      const dto: CreateAttributionDto = {
        aoId: 'ao-id',
        soumissionId: 'soumission-id',
        type: TypeAttribution.PROVISOIRE,
        dateAttribution: new Date().toISOString(),
        dateFinRecours: new Date().toISOString(),
        montantAttribue: 1000000,
      };

      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAttribution);
    });
  });

  describe('findAll', () => {
    it('devrait retourner un tableau d\'attributions', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockAttribution]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner une attribution', async () => {
      const result = await controller.findOne('test-id');
      expect(service.findOne).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockAttribution);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une attribution', async () => {
      const dto: UpdateAttributionDto = { montantAttribue: 2000000 };
      const result = await controller.update('test-id', dto);
      expect(service.update).toHaveBeenCalledWith('test-id', dto);
      expect(result.montantAttribue).toEqual(2000000);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une attribution', async () => {
      const result = await controller.remove('test-id');
      expect(service.remove).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockAttribution);
    });
  });
});
