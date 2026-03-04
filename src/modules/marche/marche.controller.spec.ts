import { Test, TestingModule } from '@nestjs/testing';
import { MarcheController } from './marche.controller';
import { MarcheService } from './marche.service';
import { CreateMarcheDto } from './dto/create-marche.dto';
import { UpdateMarcheDto } from './dto/update-marche.dto';

describe('MarcheController', () => {
  let controller: MarcheController;
  const mockMarche = {
    id: 'test-id',
    aoId: 'ao-id',
    attributionId: 'attribution-id',
    referenceMarche: 'REF-2026',
    montantSigne: 1000000,
    dateSignature: new Date(),
    delaiExecution: 180,
  };

  const mockMarcheService = {
    create: jest.fn().mockResolvedValue(mockMarche),
    findAll: jest.fn().mockResolvedValue([mockMarche]),
    findOne: jest.fn().mockResolvedValue(mockMarche),
    update: jest.fn().mockResolvedValue({ ...mockMarche, delaiExecution: 360 }),
    remove: jest.fn().mockResolvedValue(mockMarche),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarcheController],
      providers: [
        {
          provide: MarcheService,
          useValue: mockMarcheService,
        },
      ],
    }).compile();

    controller = module.get<MarcheController>(MarcheController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer une fiche marché', async () => {
      const dto: CreateMarcheDto = {
        aoId: 'ao-id',
        attributionId: 'attribution-id',
        referenceMarche: 'REF-2026',
        montantSigne: 1000000,
        dateSignature: new Date().toISOString(),
        delaiExecution: 180,
      };

      const result = await controller.create(dto);
      expect(mockMarcheService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMarche);
    });
  });

  describe('findAll', () => {
    it('devrait retourner un tableau de marchés', async () => {
      const result = await controller.findAll();
      expect(mockMarcheService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockMarche]);
    });
  });

  describe('findOne', () => {
    it('devrait retourner une fiche marché', async () => {
      const result = await controller.findOne('test-id');
      expect(mockMarcheService.findOne).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockMarche);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une fiche marché', async () => {
      const dto: UpdateMarcheDto = { delaiExecution: 360 };
      const result = await controller.update('test-id', dto);
      expect(mockMarcheService.update).toHaveBeenCalledWith('test-id', dto);
      expect(result.delaiExecution).toEqual(360);
    });
  });

  describe('remove', () => {
    it('devrait supprimer une fiche marché', async () => {
      const result = await controller.remove('test-id');
      expect(mockMarcheService.remove).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockMarche);
    });
  });
});
