import { Test, TestingModule } from '@nestjs/testing';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';

describe('LotsController', () => {
  let controller: LotsController;

  const mockLotsService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotsController],
      providers: [
        {
          provide: LotsService,
          useValue: mockLotsService,
        },
      ],
    }).compile();

    controller = module.get<LotsController>(LotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('doit appeler le service avec aoId et le dto', async () => {
      mockLotsService.create.mockResolvedValueOnce({ id: 'lot-1' });

      const dto = { numero: '1', designation: 'Lot 1', montantEstime: 100 };
      const result = await controller.create('uuid', dto);

      expect(mockLotsService.create).toHaveBeenCalledWith('uuid', dto);
      expect(result).toEqual({ id: 'lot-1' });
    });
  });

  describe('findAll', () => {
    it('doit appeler le service avec le bon aoId', async () => {
      mockLotsService.findAll.mockResolvedValueOnce([{ id: 'lot-1' }]);

      const result = await controller.findAll('uuid');

      expect(mockLotsService.findAll).toHaveBeenCalledWith('uuid');
      expect(result).toEqual([{ id: 'lot-1' }]);
    });
  });
});
