import { Test, TestingModule } from '@nestjs/testing';
import { CriteresEligibiliteController } from './criteres-eligibilite.controller';
import { CriteresEligibiliteService } from './criteres-eligibilite.service';

import { PrismaService } from '../../prisma/prisma.service';

describe('CriteresEligibiliteController', () => {
  let controller: CriteresEligibiliteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteresEligibiliteController],
      providers: [
        CriteresEligibiliteService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CriteresEligibiliteController>(
      CriteresEligibiliteController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
