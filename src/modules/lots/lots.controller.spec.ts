import { Test, TestingModule } from '@nestjs/testing';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';

import { PrismaService } from '../../prisma/prisma.service';

describe('LotsController', () => {
  let controller: LotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotsController],
      providers: [
        LotsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LotsController>(LotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
