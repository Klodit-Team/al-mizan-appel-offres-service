/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEligibiliteController } from './criteres-eligibilite.controller';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';

describe('CriteresEligibiliteController', () => {
  let controller: CriteresEligibiliteController;
  let service: any;

  const mockCriteresEligibiliteService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteresEligibiliteController],
      providers: [
        {
          provide: CriteresEligibiliteService,
          useValue: mockCriteresEligibiliteService,
        },
      ],
    }).compile();

    controller = module.get<CriteresEligibiliteController>(
      CriteresEligibiliteController,
    );
    service = module.get<CriteresEligibiliteService>(
      CriteresEligibiliteService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('doit appeler le service avec les bons paramètres', async () => {
      mockCriteresEligibiliteService.create.mockResolvedValueOnce({ id: 'c1' });
      const dto = { libelle: 'test' } as any;

      const result = await controller.create('ao-id', dto);
      expect(service.create).toHaveBeenCalledWith('ao-id', dto);
      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('findAll', () => {
    it('doit appeler le service', async () => {
      mockCriteresEligibiliteService.findAll.mockResolvedValueOnce([
        { id: 'c1' },
      ]);

      const result = await controller.findAll('ao-id');
      expect(service.findAll).toHaveBeenCalledWith('ao-id');
      expect(result).toEqual([{ id: 'c1' }]);
    });
  });

  describe('findOne', () => {
    it('doit appeler le service avec aoId et id', async () => {
      mockCriteresEligibiliteService.findOne.mockResolvedValueOnce({
        id: 'c1',
      });

      const result = await controller.findOne('ao-id', 'c1');
      expect(service.findOne).toHaveBeenCalledWith('ao-id', 'c1');
      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('update', () => {
    it('doit appeler le service avec aoId, id et dto', async () => {
      mockCriteresEligibiliteService.update.mockResolvedValueOnce({ id: 'c1' });
      const dto = { libelle: 'test' } as any;

      const result = await controller.update('ao-id', 'c1', dto);
      expect(service.update).toHaveBeenCalledWith('ao-id', 'c1', dto);
      expect(result).toEqual({ id: 'c1' });
    });
  });

  describe('remove', () => {
    it('doit appeler le service avec aoId et id', async () => {
      mockCriteresEligibiliteService.remove.mockResolvedValueOnce({ id: 'c1' });

      const result = await controller.remove('ao-id', 'c1');
      expect(service.remove).toHaveBeenCalledWith('ao-id', 'c1');
      expect(result).toEqual({ id: 'c1' });
    });
  });
});
